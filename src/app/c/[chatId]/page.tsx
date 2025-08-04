import ChatWindow from '@/components/ChatWindow';
import React, { Suspense } from 'react';

const Page = ({ params }: { params: Promise<{ chatId: string }> }) => {
  const { chatId } = React.use(params);
  return (
    <Suspense>
      <ChatWindow id={chatId} />
    </Suspense>
  );
};

export default Page;
