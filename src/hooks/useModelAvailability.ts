import { useEffect, useState } from "react";

export type ModelAvailabilityStatus = "checking" | "available" | "missing";

export interface ModelAvailability {
  status: ModelAvailabilityStatus;
  message: string | null;
}

interface ModelAvailabilityState extends ModelAvailability {
  src: string;
}

const CHECKING: ModelAvailability = {
  status: "checking",
  message: null,
};

const MISSING_HTTP: ModelAvailability = {
  status: "missing",
  message: "未找到可用的三维模型，将显示数字结构示意。",
};

const MISSING_FORMAT: ModelAvailability = {
  status: "missing",
  message: "模型响应不是有效的 GLB 文件，将显示数字结构示意。",
};

const MISSING_NETWORK: ModelAvailability = {
  status: "missing",
  message: "暂时无法检查三维模型，将显示数字结构示意。",
};

const MISSING_UNREADABLE: ModelAvailability = {
  status: "missing",
  message: "模型响应无法安全读取，将显示数字结构示意。",
};

const cancelResponseBody = async (response: Response) => {
  const body = response.body;

  if (!body || typeof body.getReader !== "function") {
    return;
  }

  const reader = body.getReader();

  try {
    await reader.cancel();
  } catch {
    // A response that closed before cancellation needs no further cleanup.
  }
};

const readGlbMagic = async (response: Response) => {
  const body = response.body;

  if (!body || typeof body.getReader !== "function") {
    return null;
  }

  const reader = body.getReader();
  const header = new Uint8Array(4);
  let offset = 0;

  try {
    while (offset < header.length) {
      const { done, value } = await reader.read();

      if (done || !value) {
        break;
      }

      const count = Math.min(value.byteLength, header.length - offset);
      header.set(value.subarray(0, count), offset);
      offset += count;
    }

    return header.subarray(0, offset);
  } finally {
    try {
      await reader.cancel();
    } catch {
      // A stream that closed between read and cleanup needs no further action.
    }
  }
};

const hasGlbMagic = (bytes: Uint8Array) => {
  return (
    bytes.length === 4 &&
    bytes[0] === 0x67 &&
    bytes[1] === 0x6c &&
    bytes[2] === 0x54 &&
    bytes[3] === 0x46
  );
};

const isAbortError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "AbortError";

export function useModelAvailability(src: string): ModelAvailability {
  const [availability, setAvailability] = useState<ModelAvailabilityState>(() => ({
    ...CHECKING,
    src,
  }));

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setAvailability({ ...CHECKING, src });

    const checkModel = async () => {
      try {
        const response = await fetch(src, {
          headers: { Range: "bytes=0-3" },
          signal: controller.signal,
        });

        if (!active) {
          await cancelResponseBody(response);
          return;
        }

        if (!response.ok) {
          await cancelResponseBody(response);

          if (active) {
            setAvailability({ ...MISSING_HTTP, src });
          }
          return;
        }

        const header = await readGlbMagic(response);

        if (!active) {
          return;
        }

        setAvailability(
          header === null
            ? { ...MISSING_UNREADABLE, src }
            : hasGlbMagic(header)
              ? { status: "available", message: null, src }
              : { ...MISSING_FORMAT, src },
        );
      } catch (error) {
        if (active && !isAbortError(error)) {
          setAvailability({ ...MISSING_NETWORK, src });
        }
      }
    };

    void checkModel();

    return () => {
      active = false;
      controller.abort();
    };
  }, [src]);

  return availability.src === src ? availability : CHECKING;
}
