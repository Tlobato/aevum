"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ItemType } from "@/types/capsule";

export function useWebRTC() {
  const [recordState, setRecordState] = useState<"IDLE" | "RECORDING" | "DONE" | "ERROR">("IDLE");
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Engine for Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recordState === "RECORDING") {
      interval = setInterval(() => { setRecordSeconds(prev => prev + 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordState]);

  const cleanupHardwareTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
         track.stop();
         streamRef.current?.removeTrack(track); // forçar remoção nativa
      });
      streamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const startHardwareRecording = async (mode: ItemType) => {
    try {
      chunksRef.current = [];
      setCapturedFile(null); // Limpa caso houvesse algum no state
      const constraints = { audio: true, video: mode === "VIDEO" };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (mode === "VIDEO" && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.muted = true; // prevent local feedback loop
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: mode === "VIDEO" ? 'video/webm' : 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mode === "VIDEO" ? 'video/webm' : 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fakeFile = new File([blob], `gravacao_${Date.now()}.webm`, { type: mimeType });
        setCapturedFile(fakeFile);
        cleanupHardwareTracks();
      };

      mediaRecorder.start();
      setRecordState("RECORDING");
      setRecordSeconds(0);
    } catch (err) {
      console.error("Hardware Recording Error:", err);
      // fallback gracioso se hardware faltar ou permissão for negada
      cleanupHardwareTracks();
      setRecordState("ERROR");
    }
  };

  const stopHardwareRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecordState("DONE");
    }
  }, []);

  const resetRecordingState = useCallback(() => {
    setRecordState("IDLE");
    setRecordSeconds(0);
    setCapturedFile(null);
    cleanupHardwareTracks();
  }, [cleanupHardwareTracks]);

  return {
    recordState,
    recordSeconds,
    capturedFile,
    liveVideoRef,
    startHardwareRecording,
    stopHardwareRecording,
    resetRecordingState,
    cleanupHardwareTracks
  };
}
