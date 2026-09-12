import Navbar from "@/components/Navbar";
import ChatContainer from "@/components/ChatContainer";

export default function Home() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main>
        <ChatContainer />
      </main>
    </div>
  );
}
