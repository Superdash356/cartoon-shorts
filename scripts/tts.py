# usage: python scripts/tts.py <text file> <out dir> [voice] [rate]  -> voice.wav + words.json (seconds)
import asyncio, json, subprocess, sys, edge_tts
txt, out = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "en-IN-PrabhatNeural"
rate = sys.argv[4] if len(sys.argv) > 4 else "+0%"
async def main():
    c = edge_tts.Communicate(open(txt).read().strip(), voice, rate=rate, boundary="WordBoundary")
    audio, words = bytearray(), []
    async for ch in c.stream():
        if ch["type"] == "audio": audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"word": ch["text"], "start": round(ch["offset"] / 1e7, 3), "end": round((ch["offset"] + ch["duration"]) / 1e7, 3)})
    open(f"{out}/voice.mp3", "wb").write(audio)
    json.dump(words, open(f"{out}/words.json", "w"), indent=1)
asyncio.run(main())
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{out}/voice.mp3", "-ar", "48000", "-ac", "1", f"{out}/voice.wav"], check=True)
print(open(f"{out}/words.json").read()[-300:])
