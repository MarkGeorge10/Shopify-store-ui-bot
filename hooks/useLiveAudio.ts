'use client';

import { useState, useRef, useCallback } from 'react';

interface UseLiveAudioOptions {
    slug: string;
    shopperEmail?: string;
    onToolCall?: (name: string, result: any) => void;
    onAIText?: (text: string) => void;
    onTurnComplete?: () => void;
}

export function useLiveAudio({ slug, shopperEmail, onToolCall, onAIText, onTurnComplete }: UseLiveAudioOptions) {
    const [isLive, setIsLive] = useState(false);
    const [level, setLevel] = useState(0);
    const socketRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const playbackQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);

    // ── Audio playback ────────────────────────────────────────────────────────
    // Gemini Live outputs 24kHz PCM audio
    const playNext = useCallback(() => {
        if (isPlayingRef.current || playbackQueueRef.current.length === 0 || !audioContextRef.current) return;

        isPlayingRef.current = true;
        const buffer = playbackQueueRef.current.shift()!;
        const int16 = new Int16Array(buffer);
        const float32 = new Float32Array(int16.length);
        for (let i = 0; i < int16.length; i++) {
            float32[i] = int16[i] / 0x7FFF;
        }

        const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            isPlayingRef.current = false;
            playNext();
        };
        source.start();
    }, []);

    const stop = useCallback(() => {
        setIsLive(false);
        setLevel(0);
        socketRef.current?.close();
        socketRef.current = null;
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        audioContextRef.current?.close();
        audioContextRef.current = null;
        playbackQueueRef.current = [];
        isPlayingRef.current = false;
    }, []);

    const start = useCallback(async () => {
        try {
            // 1. Get microphone at 16kHz (Gemini input format)
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true }
            });
            streamRef.current = stream;

            const audioContext = new AudioContext({ sampleRate: 16000 });
            audioContextRef.current = audioContext;

            // 2. Open WebSocket to backend relay
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const emailParam = shopperEmail ? `&shopper_email=${encodeURIComponent(shopperEmail)}` : '';
            const wsUrl = `${protocol}//${window.location.host.replace(':3000', ':8000')}/api/public/${slug}/live-chat?${emailParam}`;
            const socket = new WebSocket(wsUrl);
            socketRef.current = socket;
            socket.binaryType = 'arraybuffer';

            socket.onopen = () => {
                setIsLive(true);
                console.log('[Live] Connected to backend relay');
            };
            socket.onclose = () => {
                setIsLive(false);
                console.log('[Live] Disconnected');
            };
            socket.onerror = (err) => console.error('[Live] Socket error:', err);

            // 3. Handle messages from backend
            socket.onmessage = async (event) => {
                if (typeof event.data === 'string') {
                    // JSON control message
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'tool_call') {
                            onToolCall?.(data.name, data.result);
                        } else if (data.type === 'text' && data.text) {
                            // AI text transcript → add to chat panel
                            onAIText?.(data.text);
                        } else if (data.type === 'turn_complete') {
                            onTurnComplete?.();
                        } else if (data.type === 'interrupted') {
                            // Clear playback queue on interruption
                            playbackQueueRef.current = [];
                        }
                    } catch { /* ignore */ }
                } else {
                    // Binary audio from Gemini — queue for playback
                    playbackQueueRef.current.push(event.data as ArrayBuffer);
                    playNext();
                }
            };

            // 4. Set up microphone → PCM encoder → WebSocket
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
                if (socket.readyState !== WebSocket.OPEN) return;
                const inputData = e.inputBuffer.getChannelData(0);

                // Volume level for the UI pulse animation
                let sum = 0;
                for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                setLevel(Math.sqrt(sum / inputData.length));

                // Encode float32 → Int16 PCM
                const pcm = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    pcm[i] = Math.max(-32768, Math.min(32767, Math.round(inputData[i] * 32767)));
                }
                socket.send(pcm.buffer);
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

        } catch (err: any) {
            console.error('[Live] Failed to start:', err);
            stop();
        }
    }, [slug, shopperEmail, onToolCall, onAIText, onTurnComplete, stop, playNext]);

    const toggle = useCallback(() => {
        if (isLive) stop();
        else start();
    }, [isLive, start, stop]);

    return { isLive, level, toggle };
}
