import { useState, useEffect } from 'react'
import { getGoogleAuthUrl, handleGoogleCallback } from './services/authService';
import { saveChatHistory, loadAllChatHistories, loadChatHistory, deleteChatHistory } from './services/chatHistoryService';
import { ChatBubbleLeftIcon, PaperAirplaneIcon, PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { PaperClipIcon } from '@heroicons/react/24/solid'
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { sendMessageToGroq } from './services/groqService';
import { generateImage } from './services/imageService';
import { generateVideo } from './services/videoService';
import { uploadAttachment } from './services/attachmentService';

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [generationType, setGenerationType] = useState('text') // 'text', 'image', or 'video'
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [chatHistories, setChatHistories] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)

  useEffect(() => {
    // Check for authentication callback
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    
    if (code) {
      handleGoogleCallback(code).then(result => {
        if (result.success) {
          localStorage.setItem('authToken', result.token);
          setIsAuthenticated(true);
          // Remove code from URL
          window.history.replaceState({}, document.title, '/');  
        }
      });
    } else {
      // Check for existing token
      const token = localStorage.getItem('authToken');
      if (token) {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const histories = loadAllChatHistories();
      setChatHistories(histories);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
    setMessages([]);
  };

  const handleNewChat = () => {
    setMessages([])
    setInput('')
    setGenerationType('text')
    setCurrentChatId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (input.trim()) {
      setIsLoading(true)
      // Add user message
      const userMessage = { text: input, isUser: true }
      setMessages(prevMessages => {
        const newMessages = [...prevMessages, userMessage];
        if (!currentChatId) {
          setCurrentChatId(Date.now().toString());
        }
        return newMessages;
      })
      setInput('')

      try {
        let response;
        // Check if the message contains an image attachment
        const hasImageAttachment = input.includes('![');
        
        if (hasImageAttachment) {
          // Extract the image description from the message
          const messageWithoutImage = input.replace(/!\[.*?\]\(.*?\)/g, '').trim();
          if (messageWithoutImage) {
            response = await sendMessageToGroq(messageWithoutImage, 'standard');
          } else {
            response = { success: true, content: 'Image attached successfully.' };
          }
        } else if (generationType === 'image') {
          response = await generateImage(input);
        } else if (generationType === 'video') {
          response = await generateVideo(input);
        } else {
          response = await sendMessageToGroq(input, 'standard');
        }
        
        // Add AI response
        const aiMessage = { 
          text: response.success ? response.content : response.error, 
          isUser: false 
        }
        setMessages(prevMessages => {
          const newMessages = [...prevMessages, aiMessage];
          saveChatHistory(newMessages, currentChatId || Date.now().toString());
          setChatHistories(loadAllChatHistories());
          return newMessages;
        })
      } catch (error) {
        const aiMessage = {
          text: error.message || 'Sorry, there was an error processing your request.',
          isUser: false
        }
        setMessages(prevMessages => {
          const newMessages = [...prevMessages, aiMessage];
          saveChatHistory(newMessages, currentChatId || Date.now().toString());
          setChatHistories(loadAllChatHistories());
          return newMessages;
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <div className="flex h-screen bg-gpt-dark">
      {!isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center">
          <button
            onClick={handleLogin}
            className="bg-white text-gray-800 px-6 py-3 rounded-lg font-medium shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <div className="w-64 bg-gpt-gray p-4 text-white flex flex-col h-full">
            <div className="flex-1">
              <button
                onClick={handleNewChat}
                className="w-full border border-white/20 rounded-lg p-3 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
                New Chat
              </button>

              <div className="mt-4 space-y-2">
                {chatHistories.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      const history = loadChatHistory(chat.id);
                      if (history) {
                        setMessages(history.messages);
                        setCurrentChatId(chat.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer ${currentChatId === chat.id ? 'bg-white/10' : ''}`}
                  >
                    <ChatBubbleLeftIcon className="w-5 h-5" />
                    <span className="truncate text-sm">{chat.title}</span>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (deleteChatHistory(chat.id)) {
                          setChatHistories(loadAllChatHistories());
                          if (currentChatId === chat.id) {
                            handleNewChat();
                          }
                        }
                      }}
                      className="ml-auto p-1 hover:bg-white/20 rounded cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-2">
              <button
                className="w-full border border-white/20 rounded-lg p-3 text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <img
                  src={user?.picture || 'https://ui-avatars.com/api/?name=User&background=random'}
                  alt="Profile"
                  className="w-5 h-5 rounded-full"
                />
                {user?.name || 'Profile'}
              </button>

              <button
                onClick={handleLogout}
                className="w-full border border-white/20 rounded-lg p-3 text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2 text-red-400 hover:text-red-300"
              >
                Sign Out
              </button>
            </div>
          </div>
          {/* Rest of the chat interface */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {messages.map((message, index) => {
                const renderContent = () => {
                  // Split content into text and images
                  const parts = [];
                  let remainingText = message.text;
                  let imageMatch;
                  const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
                  
                  // Find all images and text segments
                  while ((imageMatch = imageRegex.exec(remainingText)) !== null) {
                    // Add text before the image if any
                    const beforeText = remainingText.slice(0, imageMatch.index).trim();
                    if (beforeText) {
                      parts.push({ type: 'text', content: beforeText });
                    }
                    
                    // Add the image
                    parts.push({
                      type: 'image',
                      alt: imageMatch[1],
                      url: imageMatch[2]
                    });
                    
                    remainingText = remainingText.slice(imageMatch.index + imageMatch[0].length);
                  }
                  
                  // Add any remaining text
                  if (remainingText.trim()) {
                    parts.push({ type: 'text', content: remainingText.trim() });
                  }
                  
                  // If no images were found or only text exists
                  if (parts.length === 0) {
                    return (
                      <ReactMarkdown
                        components={{
                        code({ inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.text}
                    </ReactMarkdown>
                    );
                  }

                  // Render all parts in sequence
                  return (
                    <div className="space-y-4">
                      {parts.map((part, index) => (
                        <div key={index}>
                          {part.type === 'text' ? (
                            <ReactMarkdown
                              components={{
                                code({ inline, className, children, ...props }) {
                                  const match = /language-(\w+)/.exec(className || '');
                                  return !inline && match ? (
                                    <SyntaxHighlighter
                                      style={oneDark}
                                      language={match[1]}
                                      PreTag="div"
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  ) : (
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  );
                                },
                              }}
                            >
                              {part.content}
                            </ReactMarkdown>
                          ) : (
                            <img
                              src={part.url}
                              alt={part.alt}
                              className="max-w-full h-auto rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
                              loading="lazy"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div key={index} className="flex items-start space-x-3">
                    {!message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white text-sm font-semibold">AI</span>
                      </div>
                    )}
                    <div 
                      className={`relative max-w-2xl rounded-2xl p-6 ${
                        message.isUser 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                          : 'bg-gpt-gray text-white/90'
                      } shadow-lg ${message.isUser ? 'rounded-br-sm' : 'rounded-bl-sm'} transition-all duration-200 hover:shadow-xl`}
                    >
                      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                        {renderContent()}
                      </div>
                    </div>
                    {message.isUser && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-white text-sm font-semibold">U</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start items-start space-x-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-sm font-semibold">AI</span>
                  </div>
                  <div className="max-w-2xl rounded-2xl p-6 bg-gpt-gray text-white/90 shadow-lg rounded-bl-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-gpt-gray/30 p-6 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={generationType === 'image' ? "Describe the image you want to generate..." : generationType === 'video' ? "Describe the video you want to generate..." : "Send a message..."}
                  className="w-full bg-gpt-gray text-white rounded-xl pl-6 pr-24 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-lg text-sm transition-shadow duration-200 hover:shadow-xl"
                  disabled={isLoading}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const result = await uploadAttachment(file);
                          if (result.success) {
                            setInput((prev) => prev + `\n![${result.attachment.name}](${result.attachment.url})`);
                          } else {
                            // Handle error
                            console.error(result.error);
                          }
                        }
                      }}
                    />
                    <PaperClipIcon className="w-5 h-5 text-white/60 hover:text-white transition-all duration-200 p-1 hover:bg-white/10 rounded-lg transform hover:scale-110" />
                  </label>
                  <button
                    type="button"
                    onClick={() => setGenerationType(generationType === 'image' ? 'text' : 'image')}
                    className={`text-white/60 hover:text-white transition-all duration-200 p-1 hover:bg-white/10 rounded-lg transform hover:scale-110 ${generationType === 'image' ? 'text-blue-400' : ''}`}
                    disabled={isLoading}
                  >
                    <PhotoIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType(generationType === 'video' ? 'text' : 'video')}
                    className={`text-white/60 hover:text-white transition-all duration-200 p-1 hover:bg-white/10 rounded-lg transform hover:scale-110 ${generationType === 'video' ? 'text-blue-400' : ''}`}
                    disabled={isLoading}
                  >
                    <VideoCameraIcon className="w-5 h-5" />
                  </button>
                  <button 
                    type="submit" 
                    className="text-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 p-1 hover:bg-white/10 rounded-lg transform hover:scale-110"
                    disabled={isLoading}
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default App
