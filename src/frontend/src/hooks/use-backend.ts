import { HttpAgent } from "@icp-sdk/core/agent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { createActor } from "../backend";
import type { SubmissionId, SubmitFormInput } from "../types";

// ─── File Upload Storage ────────────────────────────────────────────────────
// Stores uploaded file data URLs in localStorage keyed by submission ID.
// This is a frontend-only store since the backend Registration type does not
// include file reference fields.

const FILE_STORE_KEY = "alumni_submission_files";

interface SubmissionFiles {
  appointmentOrder?: string | null; // data URL or null
  appointmentOrderName?: string | null;
  companyIdCard?: string | null; // data URL or null
  companyIdCardName?: string | null;
}

type FileStore = Record<string, SubmissionFiles>;

export function getSubmissionFiles(
  submissionId: bigint,
): SubmissionFiles | null {
  try {
    const raw = localStorage.getItem(FILE_STORE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as FileStore;
    return store[submissionId.toString()] ?? null;
  } catch {
    return null;
  }
}

export function saveSubmissionFiles(
  submissionId: bigint,
  files: SubmissionFiles,
): void {
  try {
    const raw = localStorage.getItem(FILE_STORE_KEY);
    const store: FileStore = raw ? (JSON.parse(raw) as FileStore) : {};
    store[submissionId.toString()] = files;
    localStorage.setItem(FILE_STORE_KEY, JSON.stringify(store));
  } catch {
    // localStorage not available — silently skip
  }
}

/**
 * Converts a File to a data URL string.
 * Used to store file contents locally so they can be viewed/downloaded
 * from the admin detail panel without requiring a separate storage service.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads two optional files (appointment order + company ID card) and
 * stores them in localStorage, linked to the given submission ID.
 * Errors are caught individually so a single failed file never blocks the other.
 */
export async function uploadAndStoreFiles(
  submissionId: bigint,
  appointmentOrderFile: File | null,
  companyIdCardFile: File | null,
): Promise<void> {
  const result: SubmissionFiles = {};

  if (appointmentOrderFile) {
    try {
      result.appointmentOrder = await fileToDataUrl(appointmentOrderFile);
      result.appointmentOrderName = appointmentOrderFile.name;
    } catch {
      result.appointmentOrder = null;
      result.appointmentOrderName = null;
    }
  }

  if (companyIdCardFile) {
    try {
      result.companyIdCard = await fileToDataUrl(companyIdCardFile);
      result.companyIdCardName = companyIdCardFile.name;
    } catch {
      result.companyIdCard = null;
      result.companyIdCardName = null;
    }
  }

  if (appointmentOrderFile || companyIdCardFile) {
    saveSubmissionFiles(submissionId, result);
  }
}

// ─── Backend Actor ────────────────────────────────────────────────────────────

// No-op file handlers — files are handled via localStorage (see above).
// The backend Registration type does not have file blob fields.
const noopUpload = async (_file: unknown): Promise<Uint8Array> =>
  new Uint8Array();
const noopDownload = async (_bytes: Uint8Array): Promise<unknown> => ({
  directURL: "",
  getBytes: async () => new Uint8Array(),
  getDirectURL: () => "",
  withUploadProgress: () => ({}),
});

/**
 * Resolve the backend canister ID at runtime.
 *
 * Priority order:
 * 1. CANISTER_ID_BACKEND injected by vite-plugin-environment at build time
 *    (works in local dev when .env is populated by `dfx deploy`).
 * 2. backend_canister_id from /env.json, which Caffeine's deployment pipeline
 *    replaces with the real Principal string at deploy time.
 */
let _resolvedCanisterId: string | null = null;

async function resolveCanisterId(): Promise<string> {
  if (_resolvedCanisterId) return _resolvedCanisterId;

  const fromEnv =
    typeof process !== "undefined" ? process.env.CANISTER_ID_BACKEND : "";
  if (fromEnv && fromEnv !== "undefined" && fromEnv.trim() !== "") {
    _resolvedCanisterId = fromEnv;
    return _resolvedCanisterId;
  }

  try {
    const res = await fetch("/env.json");
    if (res.ok) {
      const data = (await res.json()) as Record<string, string>;
      const id = data.backend_canister_id;
      if (id && id !== "undefined" && id.trim() !== "") {
        _resolvedCanisterId = id;
        return _resolvedCanisterId;
      }
    }
  } catch {
    // env.json not available — fall through
  }

  throw new Error(
    "Could not resolve backend canister ID. The app may not be fully deployed yet.",
  );
}

function useBackendActor() {
  type ActorType = ReturnType<typeof createActor>;
  const actorRef = useRef<ActorType | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (actorRef.current) return;
    resolveCanisterId()
      .then((canisterId) => {
        const agent = HttpAgent.createSync({ host: window.location.origin });
        if (process.env.NODE_ENV !== "production") {
          agent.fetchRootKey().catch(console.error);
        }
        actorRef.current = createActor(
          canisterId,
          noopUpload as (
            file: import("../backend").ExternalBlob,
          ) => Promise<Uint8Array>,
          noopDownload as (
            file: Uint8Array,
          ) => Promise<import("../backend").ExternalBlob>,
          { agent },
        );
        forceUpdate((n) => n + 1);
      })
      .catch(console.error);
  }, []);

  return actorRef.current;
}

/**
 * Creates a one-off actor instance (not tied to React lifecycle).
 */
export async function createBackendActorOnce(): Promise<
  ReturnType<typeof createActor>
> {
  const canisterId = await resolveCanisterId();
  const agent = HttpAgent.createSync({ host: window.location.origin });
  if (process.env.NODE_ENV !== "production") {
    await agent.fetchRootKey().catch(console.error);
  }
  return createActor(
    canisterId,
    noopUpload as (
      file: import("../backend").ExternalBlob,
    ) => Promise<Uint8Array>,
    noopDownload as (
      file: Uint8Array,
    ) => Promise<import("../backend").ExternalBlob>,
    { agent },
  );
}

/**
 * @deprecated — kept for API compatibility, does nothing.
 */
export async function assignAdminRoleOnBackend(): Promise<void> {
  // No backend role assignment needed — admin auth is enforced client-side only.
}

export function useSubmitForm() {
  const actor = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitFormInput) => {
      if (!actor) throw new Error("Backend not ready");
      return actor.submitForm(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
    throwOnError: false,
  });
}

export function useListSubmissions() {
  const actor = useBackendActor();
  return useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      if (!actor) return [];
      return await actor.listSubmissions();
    },
    enabled: !!actor,
    throwOnError: true,
  });
}

export function useGetSubmission(id: SubmissionId | null) {
  const actor = useBackendActor();
  return useQuery({
    queryKey: ["submission", id?.toString()],
    queryFn: async () => {
      if (id === null || !actor) return null;
      try {
        return await actor.getSubmission(id);
      } catch {
        return null;
      }
    },
    enabled: id !== null && !!actor,
    throwOnError: false,
  });
}

export function useIsCallerAdmin() {
  const actor = useBackendActor();
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor,
    throwOnError: false,
  });
}

export function useGetBankDetails() {
  const actor = useBackendActor();
  return useQuery({
    queryKey: ["bank-details"],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getBankDetails();
      } catch {
        return null;
      }
    },
    enabled: !!actor,
    throwOnError: false,
  });
}

export function useSetBankDetails() {
  const actor = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (details: import("../types").BankDetails) => {
      if (!actor) throw new Error("Backend not ready");
      return actor.setBankDetails(details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-details"] });
    },
    throwOnError: false,
  });
}
