# Per-line edge-tts with its own rate / pitch / volume ("voice modulation"), stitched with set gaps.
# usage: python scripts/tts_lines.py <lines.json> <out dir> [voice override]
# writes voice.wav (48 kHz mono) + words.json (word onsets in seconds, plus "line" index)
import asyncio, json, subprocess, sys, wave
import edge_tts
spec = json.load(open(sys.argv[1])); out = sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else spec["voice"]
SR = 48000
async def line(i, L):
    for attempt in range(5):
        try:
            return await _line(i, L)
        except edge_tts.exceptions.NoAudioReceived:
            print("retry line", i, attempt + 1, flush=True); await asyncio.sleep(3 + 3 * attempt)
    return await _line(i, {**L, "pitch": "+0Hz", "volume": "+0%"})
async def _line(i, L):
    c = edge_tts.Communicate(L["text"], voice, rate=L.get("rate", "+0%"), pitch=L.get("pitch", "+0Hz"), volume=L.get("volume", "+0%"), boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary": words.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
    open(f"/tmp/l{i}.mp3", "wb").write(audio)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"/tmp/l{i}.mp3", "-ar", str(SR), "-ac", "1", "-sample_fmt", "s16", f"/tmp/l{i}.wav"], check=True)
    return words
async def main():
    pcm, words, t = bytearray(), [], 0.0
    for i, L in enumerate(spec["lines"]):
        ws = await line(i, L)
        with wave.open(f"/tmp/l{i}.wav") as w: data = w.readframes(w.getnframes())
        # trim edge-tts leading/trailing silence to the spoken span (+40 ms pad)
        n = len(data) // 2
        a = max(0, int((ws[0][1] - 0.04) * SR)) if ws else 0
        b = min(n, int((ws[-1][2] + 0.12) * SR)) if ws else n
        seg = data[a * 2: b * 2]
        for (tx, s, e) in ws: words.append({"word": tx, "start": round(t + s - a / SR, 3), "end": round(t + e - a / SR, 3), "line": i})
        pcm += seg; t += len(seg) / 2 / SR
        gap = int(L.get("gap", 0.1) * SR); pcm += b"\x00\x00" * gap; t += gap / SR
    with wave.open(f"{out}/voice.wav", "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(bytes(pcm))
    json.dump(words, open(f"{out}/words.json", "w"), indent=1)
    print("duration", round(t, 2), "words", len(words))
asyncio.run(main())
