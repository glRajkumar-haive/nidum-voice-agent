
export const nidum_ai_phone_number = "5Tyomdj5z6XoxiYN"
export const nidum_ai_id = "87c80b02-5bbf-4649-b737-0f505f510d21_e6ebe51c-be2c-48b9-8073-e4222790509a"
// export const agentUserId = "96317187-8cde-459b-b648-ce87316770aa"

export const liveKitWsUrl = "wss://livekiturldev.chain.nidum.ai"
export const mlBackend = "https://mlbackenddev1.chain.nidum.ai"

export function generateRandomAlphanumeric(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}
