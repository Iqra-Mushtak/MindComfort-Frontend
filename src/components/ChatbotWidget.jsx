import React, { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import "./ChatbotWidget.css";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your MindComfort Coping Companion. How are you feeling today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = (behavior = "smooth") => {
    chatEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom("smooth");
    }
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const updatedMessages = [...messages, { sender: "user", text: userMessage }];
    
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/chatbot/message", { 
        messages: updatedMessages,
        prompt: userMessage 
      });
      setMessages((prev) => [...prev, { sender: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I am having trouble connecting right now. Please try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-trigger-btn"
          title="Open AI Coping Companion"
        >
          <i className="bi bi-chat-dots-fill me-2"></i>
          MindComfort AI
        </button>
      ) : (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-robot fs-5"></i>
              <div>
                <div className="chatbot-title">MindComfort Companion</div>
                <div className="chatbot-subtitle">CBT Support & Platform Guide</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              aria-label="Close"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="chatbot-messages-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chatbot-msg-row ${msg.sender === "user" ? "user" : "bot"}`}
              >
                <div
                  className={`chatbot-bubble ${
                    msg.sender === "user" ? "user" : "bot"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chatbot-msg-row bot">
                <div className="chatbot-bubble thinking">
                  <i className="bi bi-three-dots"></i> Thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="chatbot-footer-form">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or share your feelings..."
              className="chatbot-input"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="chatbot-send-btn"
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}