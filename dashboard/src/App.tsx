import { io, Socket } from 'socket.io-client';
import './App.css';
import toast from 'react-hot-toast';
import { useEffect, useRef } from 'react';

function App() {
  const workerSocketRef = useRef<Socket | null>(null);
  const producerSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const workerSocket = io("http://localhost:3001", {
      transports: ["websocket"],
    });

    const producerSocket = io("http://localhost:3000", {
      transports: ["websocket"],
    });
    workerSocketRef.current = workerSocket;
    producerSocketRef.current = producerSocket;

    // Connections
    workerSocket.on("connect", () => {
      toast.success("Connected to Worker Socket");
    });

    producerSocket.on("connect", () => {
      toast.success("Connected to Producer Socket");
    });

    // Messages
    producerSocket.on("message", (data) => {
      console.log("Got Message", data);
      if (data.type === "populate-data-response") {
        toast.success(data.message);
      }
    });

    workerSocket.on("message", (data) => {
      console.log("Got Message", data);
      if (data.type === "start-working-response") {
        toast.success(data.message);
      }
    });


    return () => {
      workerSocket.disconnect();
      producerSocket.disconnect();
    };
  }, []);

  const handlePopulationData = () => {
    console.log("BUTTON CLICKED");

    if (!producerSocketRef.current) {
      console.log("Producer socket NOT READY");
      return;
    }

    console.log("Emitting event...");

    producerSocketRef.current.emit('message', {
      type: 'populate-data',
    });

    toast.success("Event emitted");
  };

  const handleStartWorkers = () => {
    console.log("BUTTON CLICKED");

    if (!workerSocketRef.current) {
      console.log("Producer socket NOT READY");
      return;
    }

    console.log("Emitting event...");

    workerSocketRef.current.emit('message', {
      type: 'start-working',
    });

    toast.success("Event emitted");
  }


  return (
    <div className='bg-black h-screen text-white'>
      <div>
        <button
          className='cursor-pointer border-2 p-4 m-4'
          onClick={handlePopulationData}
        >
          Start Producer
        </button>
        <button
          className='cursor-pointer border-2 p-4 m-4'
          onClick={handleStartWorkers}
        >
          Start Worker
        </button>
      </div>
    </div>
  );
}

export default App;