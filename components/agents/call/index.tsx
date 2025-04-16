"use client";

import { useCallback } from "react";
import { LiveKitRoom, RoomAudioRenderer, StartAudio } from "@livekit/components-react";

import { ConnectionProvider, useConnection } from "../hooks/use-connections";
import { nidum_ai_id, nidum_ai_phone_number } from '../utils';

import Playground from "./playground";

function Inner() {
  const {
    shouldConnect, wsUrl, token,
    connect, disconnect
  } = useConnection()

  const handleConnect = useCallback(async (c: boolean) => {
    c ? connect() : disconnect()
  }, [connect, disconnect])

  return (
    <LiveKitRoom
      token={token}
      serverUrl={wsUrl}
      connect={shouldConnect}
      onError={(e) => console.error(e)}
      className="flex flex-col h-full w-full"
    >
      <Playground onConnect={handleConnect} />
      <RoomAudioRenderer />
      <StartAudio label="Click to enable audio playback" />
    </LiveKitRoom>
  )
}

function Call() {
  return (
    <ConnectionProvider
      id={nidum_ai_id}
      phone_number={nidum_ai_phone_number}
    >
      <Inner />
    </ConnectionProvider>
  )
}

export default Call
