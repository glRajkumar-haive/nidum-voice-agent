import { createContext, useState, useCallback, useContext, ReactNode } from "react";
import { liveKitWsUrl, mlBackend } from "../utils";

type ConnectionData = {
  shouldConnect: boolean
  wsUrl: string
  token: string
  connect: () => Promise<void>
  disconnect: () => void
}

const ConnectionContext = createContext<ConnectionData | undefined>(undefined)

type detailsT = {
  wsUrl: string
  token: string
  shouldConnect: boolean
}

type props = {
  children: ReactNode
  phone_number: string
  id: string
}

export const ConnectionProvider = ({ children, phone_number, id }: props) => {
  const [connectionDetails, setConnectionDetails] = useState<detailsT>({
    wsUrl: "",
    token: "",
    shouldConnect: false,
  })

  const connect = useCallback(async () => {
    const { accessToken } = await fetch(
      `${mlBackend}/generate-token?phone=${phone_number}&id=${id}`
    ).then((res) => res.json())
    setConnectionDetails({ wsUrl: liveKitWsUrl, token: accessToken, shouldConnect: true })
  }, [id, phone_number])

  const disconnect = useCallback(() => {
    setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }))
  }, [])

  return (
    <ConnectionContext.Provider
      value={{
        wsUrl: connectionDetails.wsUrl,
        token: connectionDetails.token,
        shouldConnect: connectionDetails.shouldConnect,
        connect,
        disconnect,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export const useConnection = () => {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider")
  }
  return context
}
