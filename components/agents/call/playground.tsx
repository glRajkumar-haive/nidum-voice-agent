import { useEffect, useMemo, useState } from "react";
import { BsMicFill, BsMicMuteFill } from "react-icons/bs";
import { LuLoader, LuX } from "react-icons/lu";
import { nanoid } from "nanoid";

import {
  TrackReferenceOrPlaceholder,
  useConnectionState,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
  useTrackTranscription,
  useVoiceAssistant,
  useChat as useChatMsg,
  useTrackToggle
} from "@livekit/components-react";

import {
  ConnectionState,
  LocalParticipant,
  RoomEvent,
  Track,
} from "livekit-client";

import { useMultibandTrackVolume } from "../hooks/use-track-volume";
import useUIStore from "@/store/ui";

import AudioVisualizer from "./audio-visualizer";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PlaygroundProps {
  onConnect: (connect: boolean) => void
}

type ChatMessageType = {
  name: string
  message: string
  isSelf: boolean
  timestamp: number
}

function mergeMessages(messages: any[]): any[] {
  if (messages.length === 0) return [];

  const merged: any[] = [];

  for (const msg of messages) {
    const lastMsg = merged[merged.length - 1];

    if (lastMsg && lastMsg.isSelf === msg.isSelf && lastMsg.name === msg.name) {
      lastMsg.message += ` ${msg.message}`;
    } else {
      merged.push({ ...msg });
    }
  }

  return merged;
}

function Playground({ onConnect }: PlaygroundProps) {
  const [transcripts, setTranscripts] = useState<ChatMessageType[]>([])
  const { localParticipant, microphoneTrack } = useLocalParticipant()

  const participants = useRemoteParticipants({
    updateOnlyOn: [RoomEvent.ParticipantMetadataChanged],
  })
  const agentParticipant = participants.find((p) => p.isAgent)

  const closeModel = useUIStore(s => s.close)

  const { buttonProps, enabled } = useTrackToggle({
    source: Track.Source.Microphone
  })

  const roomState = useConnectionState()
  const tracks = useTracks()

  const voiceAssistant = useVoiceAssistant()
  const agentMessages = useTrackTranscription(voiceAssistant.audioTrack)
  const { chatMessages } = useChatMsg()

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setMicrophoneEnabled(true)
    }
  }, [localParticipant, roomState])

  let agentAudioTrack: TrackReferenceOrPlaceholder | undefined
  const aat = tracks.find(
    (trackRef) =>
      trackRef.publication.kind === Track.Kind.Audio &&
      trackRef.participant.isAgent
  )
  if (aat) {
    agentAudioTrack = aat
  } else if (agentParticipant) {
    agentAudioTrack = {
      participant: agentParticipant,
      source: Track.Source.Microphone,
    }
  }

  const subscribedVolumes = useMultibandTrackVolume(
    agentAudioTrack?.publication?.track,
    5
  )

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  )
  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  )

  const localMultibandVolume = useMultibandTrackVolume(
    localMicTrack?.publication.track,
    20
  )

  const localMessages = useTrackTranscription({
    publication: microphoneTrack,
    source: Track.Source.Microphone,
    participant: localParticipant,
  })

  useEffect(() => {
    onConnect(true)
  }, [])

  useEffect(() => {
    const transcripts = new Map()
    agentMessages.segments.forEach((s) => {
      transcripts.set(
        s.id,
        { ...s, name: "Agent", isSelf: false }
      )
    })
    localMessages.segments.forEach((s) => {
      transcripts.set(
        s.id,
        { ...s, name: "You", isSelf: true }
      )
    });

    const allMessages = Array.from(transcripts.values());

    const payload: ChatMessageType[] = [...allMessages].sort((a, b) => a.lastReceivedTime - b.lastReceivedTime).map(msg => ({
      isSelf: msg.isSelf,
      name: msg?.name,
      message: msg?.text,
      timestamp: msg?.lastReceivedTime,
    }))

    setTranscripts(mergeMessages(payload))
  }, [
    chatMessages,
    localParticipant,
    voiceAssistant.audioTrack?.participant,
    agentMessages.segments,
    localMessages.segments,
  ])

  const audioContent = useMemo(() => {
    const disconnectedContent = (
      <div className="flex items-center justify-center gap-2 flex-1 text-sm text-gray-400">
        Connect to get started
      </div>
    )

    const waitingContent = (
      <div className="flex items-center justify-center gap-2 flex-1 gap-4">
        <LuLoader className="animate-spin text-2xl" />
      </div>
    )

    const visualizerContent = (
      <div className="flex items-center justify-center gap-2 flex-1">
        <AudioVisualizer
          state="speaking"
          barWidth={14}
          minBarHeight={20}
          maxBarHeight={240}
          accentColor="bg-white"
          accentShade="shadow-white"
          frequencies={subscribedVolumes}
          borderRadius={8}
          gap={8}
        />
      </div>
    )

    if (roomState === ConnectionState.Disconnected) {
      return disconnectedContent
    }

    if (!agentAudioTrack) {
      return waitingContent
    }

    return visualizerContent
  }, [
    agentAudioTrack,
    subscribedVolumes,
    roomState,
  ])

  function onClose() {
    if (transcripts.length > 0) {
      const data = transcripts.map(m => ({
        id: nanoid(10),
        role: m.isSelf ? "user" : "assistant",
        content: m.message,
      }))
      console.log(data)
    }
    onConnect(false)
    closeModel()
  }

  return (
    <>
      {audioContent}

      {localMicTrack && (
        <div className="flex items-center justify-center gap-2 h-[40px] mb-6">
          {
            voiceAssistant?.agentAttributes?.["voice_assistant.state"] === "thinking" ?
              <div className="flex flex-col items-center gap-2">
                <LuLoader className="size-7 animate-spin" />
                <p className="text-sm text-zinc-400">Thinking</p>
              </div>
              :
              <AudioVisualizer
                state="speaking"
                barWidth={4}
                minBarHeight={2}
                maxBarHeight={50}
                accentColor={"bg-gray-400"}
                accentShade="shadow-gray-400"
                frequencies={localMultibandVolume}
                borderRadius={2}
                gap={4}
              />
          }
        </div>
      )}

      <div className="flex items-center justify-center gap-2 flex-row gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button {...buttonProps} className={`flex items-center justify-center gap-2 size-12 border rounded-full ${enabled ? "bg-input/50" : "bg-red-300/10 text-red-400"}`}>
                {
                  enabled
                    ? <BsMicFill className="size-5" />
                    : <BsMicMuteFill className="size-5" />
                }
              </button>
            </TooltipTrigger>

            <TooltipContent>
              Turn {enabled ? "off" : "on"} microphone
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 size-12 border rounded-full bg-input/50"
              >
                <LuX className="size-6" />
              </button>
            </TooltipTrigger>

            <TooltipContent>
              End chat
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  )
}

export default Playground
