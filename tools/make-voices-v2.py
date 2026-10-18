"""Generate original neural Mandarin performances and offline game MP3 assets.

Requires: Python 3.10+, edge-tts==7.3.1, ffmpeg/ffprobe on PATH.
Only authored dialogue in docs/audio-cues.json is sent to the TTS service.
No original SAPI recordings are pitch-shifted or reused as neural sources.
"""
import argparse
import asyncio
import hashlib
import importlib.metadata
import json
import re
from pathlib import Path
import subprocess
import tempfile

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "docs/audio-cues.json").read_text(encoding="utf-8"))
OUTPUT = ROOT / MANIFEST["output"]


def probe(path):
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration,size",
                             "-of", "json", str(path)], check=True, text=True, capture_output=True)
    return json.loads(result.stdout)["format"]


def signature(cue, profile):
    return hashlib.sha256(json.dumps({"cue": cue, "profile": profile},
                                     ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


async def generate(cue, semaphore, force):
    profile = MANIFEST["profiles"][cue["role"]]
    stamp = signature(cue, profile)
    destination = OUTPUT / (cue["id"] + ".mp3")
    source = OUTPUT / "source" / (cue["id"] + ".mp3")
    metadata = OUTPUT / "source" / (cue["id"] + ".json")
    if not force and destination.exists() and source.exists() and metadata.exists():
        saved = json.loads(metadata.read_text(encoding="utf-8"))
        if saved.get("signature") == stamp:
            probe(destination)
            print("Cached: " + cue["id"], flush=True)
            return saved
    async with semaphore:
        with tempfile.TemporaryDirectory(prefix="xunsheng-neural-") as folder:
            raw = Path(folder) / "neural.mp3"
            mixed = Path(folder) / "mixed.mp3"
            for attempt in range(3):
                try:
                    communication = edge_tts.Communicate(cue["text"], profile["voice"],
                        rate=profile["rate"], pitch=profile["pitch"], volume="+0%")
                    await asyncio.wait_for(communication.save(str(raw)), timeout=70)
                    if float(probe(raw)["duration"]) < .3:
                        raise RuntimeError("Neural service returned an empty clip")
                    break
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 + attempt * 3)
            filters = ["highpass=f=65", "lowpass=f=10500",
                       "equalizer=f=170:width_type=o:width=1.2:g=" + str(profile["body"]),
                       "acompressor=threshold=0.16:ratio=2.1:attack=18:release=150"]
            if profile.get("echo"):
                filters.append(f'aecho=0.85:0.9:{profile["delay"]}:{profile["echo"]}')
            filters.extend(["loudnorm=I=-17:TP=-2:LRA=8", "apad=pad_dur=0.1"])
            subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(raw),
                "-af", ",".join(filters), "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame",
                "-b:a", "96k", str(mixed)], check=True)
            details = probe(mixed)
            raw_bytes = raw.read_bytes()
            mixed_bytes = mixed.read_bytes()
            source.write_bytes(raw_bytes)
            destination.write_bytes(mixed_bytes)
            record = {"id": cue["id"], "text": cue["text"], "speaker": cue["speaker"],
                      "voice": profile["voice"], "rate": profile["rate"], "pitch": profile["pitch"],
                      "engine": "Microsoft Edge neural TTS", "client": "edge-tts " + importlib.metadata.version("edge-tts"),
                      "signature": stamp, "source_sha256": hashlib.sha256(raw_bytes).hexdigest(),
                      "mixed_sha256": hashlib.sha256(mixed_bytes).hexdigest(),
                      "duration": float(details["duration"]), "size": int(details["size"]),
                      "file": "assets/audio/voice-v2/" + destination.name,
                      "source": "assets/audio/voice-v2/source/" + source.name,
                      "filters": filters}
            metadata.write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f'Neural: {cue["id"]} ({record["duration"]:.2f}s, {profile["voice"]})', flush=True)
            return record


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--only", nargs="*", help="Regenerate selected cue IDs")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "source").mkdir(exist_ok=True)
    selected = [cue for cue in MANIFEST["cues"] if not args.only or cue["id"] in args.only]
    if not selected:
        raise SystemExit("No matching cue IDs")
    semaphore = asyncio.Semaphore(3)
    await asyncio.gather(*(generate(cue, semaphore, args.force) for cue in selected))
    records = []
    for cue in MANIFEST["cues"]:
        metadata = OUTPUT / "source" / (cue["id"] + ".json")
        if metadata.exists():
            records.append(json.loads(metadata.read_text(encoding="utf-8")))
    (OUTPUT / "manifest.json").write_text(json.dumps({"version": 2, "generated": "2026-10-18",
        "engine": MANIFEST["engine"], "clips": records}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    sound_file = ROOT / "prototype/sound.js"
    cues = {cue["id"]: [cue["speaker"], cue["text"]] for cue in MANIFEST["cues"]}
    source = sound_file.read_text(encoding="utf-8")
    source, count = re.subn(r"(?<=  // VOICE_CUES_START)[^\n]*\n[\s\S]*?(?=  // VOICE_CUES_END)",
        " (kept in sync with docs/audio-cues.json by make-voices-v2.py)\n  const voiceCues = " +
        json.dumps(cues, ensure_ascii=False, separators=(",", ":")) + ";\n", source)
    if count != 1:
        raise RuntimeError("Missing runtime subtitle markers")
    sound_file.write_text(source, encoding="utf-8")
    print(f"Ready: {len(records)} neural clips in {OUTPUT}")


if __name__ == "__main__":
    asyncio.run(main())
