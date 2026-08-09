"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ItemType } from "@/types/capsule";

function getSupportedMimeType(mode: "VIDEO" | "AUDIO"): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  const videoTypes = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm",
    "video/mp4;codecs=h264,aac",
    "video/mp4",
    "video/quicktime"
  ];

  const audioTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg",
    "audio/wav"
  ];

  const typesToCheck = mode === "VIDEO" ? videoTypes : audioTypes;

  for (const type of typesToCheck) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeLower = mimeType.toLowerCase();
  if (mimeLower.includes("video/mp4")) return "mp4";
  if (mimeLower.includes("video/quicktime")) return "mov";
  if (mimeLower.includes("video/webm")) return "webm";
  if (mimeLower.includes("audio/mp4") || mimeLower.includes("audio/m4a")) return "m4a";
  if (mimeLower.includes("audio/aac")) return "aac";
  if (mimeLower.includes("audio/webm")) return "webm";
  if (mimeLower.includes("audio/ogg")) return "ogg";
  if (mimeLower.includes("audio/wav")) return "wav";
  return "bin";
}

export function useWebRTC() {
  const [recordState, setRecordState] = useState<"IDLE" | "RECORDING" | "CAMERA_READY" | "DONE" | "ERROR">("IDLE");
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
      const constraints = { 
        audio: mode === "AUDIO" || mode === "VIDEO", 
        video: mode === "VIDEO" || mode === "PHOTO" 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if ((mode === "VIDEO" || mode === "PHOTO") && liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.muted = true; // prevent local feedback loop
      }

      if (mode === "PHOTO") {
          setRecordState("CAMERA_READY");
          return;
      }

      const mimeType = getSupportedMimeType(mode as "VIDEO" | "AUDIO");
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || (mode === "VIDEO" ? 'video/webm' : 'audio/webm');
        const ext = getExtensionFromMimeType(actualMimeType);
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        const fakeFile = new File([blob], `gravacao_${Date.now()}.${ext}`, { type: actualMimeType });
        setCapturedFile(fakeFile);
        cleanupHardwareTracks();
        setRecordState("DONE");
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
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      } else {
        // Se já parou por conta própria (ex: evento do browser), força estado final
        setRecordState("DONE");
        cleanupHardwareTracks();
      }
    }
  }, [cleanupHardwareTracks]);

  const capturePhoto = useCallback(() => {
      if (!liveVideoRef.current || !streamRef.current) return;
      const video = liveVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
              if (blob) {
                  const fakeFile = new File([blob], `foto_${Date.now()}.jpg`, { type: "image/jpeg" });
                  setCapturedFile(fakeFile);
                  setRecordState("DONE");
                  cleanupHardwareTracks();
              }
          }, "image/jpeg", 0.9);
      }
  }, [cleanupHardwareTracks]);

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
    capturePhoto,
    resetRecordingState,
    cleanupHardwareTracks
  };
}
