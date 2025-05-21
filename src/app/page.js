'use client';
import { useState, useRef, useEffect } from "react";
import { SYSTEM_PROMPT } from "@/utils/prompt";

export default function Home() {
  const helloMessages = ["Welcome! 😊 To begin, could you please share your first name?", "Hi there! 👋 May I have your first name to begin our conversation?","Welcome! 😊 May I ask for your first name to begin?"]
  const randomHelloMessageIndex = Math.floor(Math.random()*2) + 1
  const [messages, setMessages] = useState([
    {role: "system", content: SYSTEM_PROMPT},
    {role: "assistant", content: helloMessages[randomHelloMessageIndex]}
  ]);
  const [input, setInput] = useState("");
  const [inputDisabled, setInputDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optionsValues, setOptionsValues] = useState([])
  const showPreloadFromEnv = process.env.NEXT_PUBLIC_LOADING_SCREEN === "true" ? true : false;
  const [showPreload, setShowPreload] = useState(showPreloadFromEnv);
  const inputRef = useRef(null);
  const bottomRef = useRef(null);
  const [queuePosition, setQueuePosition] = useState(null);

  useEffect(() => {
    const random = Math.floor(Math.random() * 5) + 2;
    setQueuePosition(random);
  }, []);

  const [progress, setProgress] = useState(0);
  const [fakeChat, setFakeChat] = useState([]);
  const lastMessage = messages[messages.length - 1];
  const allMessagePairs = [
    [
      { role: "user", content: "How much does it cost to replace 3 windows?" },
      { role: "assistant", content: "That depends on the size and type — I can help you!" }
    ],
    [
      { role: "user", content: "Do you offer bay window installation?" },
      { role: "assistant", content: "Yes we do! Would you like a free quote?" }
    ],
    [
      { role: "user", content: "Can I book a consultation online?" },
      { role: "assistant", content: "Of course! I’ll help you schedule one now." }
    ],
    [
      { role: "user", content: "What’s your turnaround time for installation?" },
      { role: "assistant", content: "Usually 5–7 days after approval." }
    ],
    [
      { role: "user", content: "Do you install triple-glazed windows?" },
      { role: "assistant", content: "Yes — they’re great for insulation!" }
    ]
  ];





  // Focus input after each GPT response
  useEffect(() => {
    if (!loading && !showPreload && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, showPreload]);

//fake chat
  useEffect(() => {
    if (!showPreload) return;

    // Shuffle the message pairs
    const shuffledPairs = [...allMessagePairs].sort(() => Math.random() - 0.5);

    // Flatten the pairs into a single array of messages
    const randomizedMessages = shuffledPairs.flat();

    let index = 0;

    const interval = setInterval(() => {
      if (index >= randomizedMessages.length) {
        clearInterval(interval);
        return;
      }

      const nextMessage = randomizedMessages[index];
      setFakeChat(prev => [...prev, nextMessage]);
      index++;
    }, 1500); // one message per second

    return () => clearInterval(interval);
  }, [showPreload]);




  // Scroll to bottom when messages change
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({behavior: "smooth"});
    }
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPreload(false);
      setFakeChat([]); // clear fake messages
    }, 9000);

    return () => clearTimeout(timer);
  }, []);



  useEffect(() => {
    if (!showPreload) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1; // adjust speed here (e.g., +2 is faster)
      });
    }, 95); // ~5.5 seconds total (100 x 55ms)

    return () => clearInterval(interval);
  }, [showPreload]);


  const sendMessage = async (e, injectedInput = null) => {
    e.preventDefault();
    const userInput = injectedInput ?? input;
    if (!userInput.trim()) return;

    const updated = [...messages, {role: "user", content: userInput}];
    setMessages(updated);
    setInput("");
    setLoading(true);

    const res = await fetch(process.env.NEXT_PUBLIC_REMODELMATCH_API_URL+"/api/chat", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({messages: updated, key:process.env.NEXT_PUBLIC_REMODELMATCH_API_KEY})
    });

    const data = await res.json();
    const reply = data.reply;

    // Check for end flag
    let isDone = false;
    const match = reply.match(/```json\s*{[^}]*"done"\s*:\s*true[^}]*}\s*```/i);
    if (match) isDone = true;

    // Remove JSON from display
    // const cleanedReply = reply.replace(/```json\s*{[^`]+}\s*```/i, "").trim();
    const {cleanedReply, objectFromApi} = extractJsonAndCleanText(reply);
    const showOptions = Array.isArray(objectFromApi) && objectFromApi[0]?.options === true;
    const optionsValues = showOptions === true ? objectFromApi[0]?.options_values : false;

    if (showOptions) {
      setOptionsValues(objectFromApi[0]?.options_values || []);
    } else {
      setOptionsValues([]);
    }

    console.log(showOptions, optionsValues);
    console.log(objectFromApi);
    setMessages([...updated, {role: "assistant", content: cleanedReply}]);
    setInputDisabled(isDone);
    setLoading(false);
  };

  const handleQuickReply = async (value) => {
    await sendMessage({
      preventDefault: () => {
      }
    }, value);
  };

  return (
      <main style={{maxWidth: 600, margin: "2rem auto", padding: "1rem", textAlign: "center"}}>
        {showPreload ? (
            <div style={{ paddingTop: "3rem" }}>
              <h2 style={{ fontSize: 25 }}>
                <strong>⏳ {queuePosition} people are in the line in front of you...</strong>
              </h2>
              <p style={{ fontSize: 20 }}>Waiting for Assistant to free up... </p>

              <div style={{ height: "10px", width: "100%", background: "#eee", borderRadius: "4px", overflow: "hidden", margin: "1.5rem 0" }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor: "#007bff",
                  transition: "width 0.05s linear"
                }} />
              </div>

              {/* Fake chat stream */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1.5rem" }}>
                {fakeChat.map((m, i) => (
                    <p
                        className={"chatTextMessage"}
                        key={i}
                        style={{
                          alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                          backgroundColor: m.role === "user" ? "#DCF8C6" : "#F1F0F0",
                          color: "#000",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "16px",
                          maxWidth: "80%",
                          whiteSpace: "pre-wrap",
                          fontSize: "1rem",
                          filter: "blur(0.5px)",
                          opacity: 0.6,
                          animation: m.role === "user" ? "slideInRight 0.3s ease-out" : "slideInLeft 0.3s ease-out"
                        }}
                    >
                      <strong>{m.role === "user" ? "You" : "Assistant"}:</strong> {m.content}
                    </p>
                ))}
              </div>
            </div>

        ) : (
            <>
              <h1>🏠 Home Repair Assistant</h1>
              <br/>

              <div style={{display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem"}}>
                {messages
                    .filter(m => m.role !== "system")
                    .map((m, i) => (
                        <p
                            className={"chatTextMessage"}
                            key={i}
                            style={{
                              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                              backgroundColor: m.role === "user" ? "#DCF8C6" : "#F1F0F0",
                              color: "#000",
                              padding: "0.5rem 0.75rem",
                              borderRadius: "16px",
                              maxWidth: "80%",
                              whiteSpace: "pre-wrap",
                              fontSize: "1rem",
                            }}
                        >
                          <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>{" "}
                          <span dangerouslySetInnerHTML={{__html: convertMarkdownBoldToHtml(m.content)}}/>
                        </p>
                    ))}
                <div ref={bottomRef}/>
              </div>

              {optionsValues.length > 0 && (
                  <div style={{display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap"}}>
                    {optionsValues.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickReply(option)}
                            style={{
                              padding: "0.5rem 1rem",
                              backgroundColor: "#007bff",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "1rem"
                            }}
                        >
                          {option}
                        </button>
                    ))}
                  </div>
              )}

              <form onSubmit={sendMessage}>
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={loading ? "Waiting for Assistant..." : "Type your answer..."}
                    className="border-2"
                    disabled={loading || inputDisabled}
                    style={{width: "100%", padding: "0.5rem", fontSize: "1rem", borderRadius:"0.5rem", borderColor:"#c8b5b5"}}
                />
              </form>
            </>
        )}
      </main>
  );
}
  const extractJsonAndCleanText = (reply) => {
  const jsonBlockRegex = /```json\s*([\s\S]*?)\s*```/i;
  const looseJsonRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;

  let objectFromApi = null;
  let cleanedReply = reply;

  const blockMatch = reply.match(jsonBlockRegex);
  if (blockMatch) {
    const blockContent = blockMatch[1]?.trim();

    // ✅ Try to parse only if content exists
    if (blockContent) {
      try {
        objectFromApi = JSON.parse(blockContent);
      } catch (err) {
        console.error("Failed to parse JSON from code block:", err.message);
      }
    } else {
      console.warn("JSON block found, but it was empty.");
    }

    // ✅ Always remove the full block (even if invalid or empty)
    cleanedReply = cleanedReply.replace(blockMatch[0], '').trim();
  } else {
    // Fallback: remove any lone ```json``` or ``` ```
    cleanedReply = cleanedReply.replace(/```json|```/gi, '').trim();

    // Try to extract loose JSON from body
    const looseMatch = reply.match(looseJsonRegex);
    if (looseMatch && looseMatch[0]) {
      try {
        objectFromApi = JSON.parse(looseMatch[0]);
      } catch (err) {
        console.error("Failed to parse loose JSON:", err.message);
      }

      cleanedReply = cleanedReply.replace(looseMatch[0], '').trim();
    }
  }

  return { cleanedReply, objectFromApi };
};




const convertMarkdownBoldToHtml = (text) => {
    if(text){
        return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    }else{
        return text;
    }
};


