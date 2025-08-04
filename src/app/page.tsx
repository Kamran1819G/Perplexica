import ChatWindow from '@/components/ChatWindow';
import { Suspense } from 'react';

export default function Home() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <ChatWindow />
      </Suspense>
    </div>
  );
}
