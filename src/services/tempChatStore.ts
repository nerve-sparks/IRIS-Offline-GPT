type Sender = 'user' | 'assistant';

type TempMessage = {
  id: string;
  text: string;
  sender: Sender;
  timestamp: string;
};

const tempMessages: TempMessage[] = [];

export function addTempMessage(text: string, isUser: boolean) {
  const message: TempMessage = {
    id: `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    text,
    sender: isUser ? 'user' : 'assistant',
    timestamp: new Date().toISOString(),
  };
  tempMessages.push(message);
  return message;
}

export function getTempMessages() {
  return [...tempMessages];
}

export function endTempSession() {
  tempMessages.length = 0;
}
