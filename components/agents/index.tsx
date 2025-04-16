"use client";

import { LuAudioLines } from "react-icons/lu";

import useUIStore from "@/store/ui";

import Call from "./call";

function Agent() {
  const update = useUIStore(s => s.update)
  const open = useUIStore(s => s.open)

  if (open === "open") {
    return <Call />
  }

  return (
    <button
      className="flex items-center justify-center size-8 p-0 animate-in bg-zinc-200 hover:bg-zinc-200/80 rounded-full"
      onClick={() => update({ open: "open" })}
      title="Use voice mode"
    >
      <LuAudioLines className="text-lg text-zinc-900" />
    </button>
  )
}

export default Agent
