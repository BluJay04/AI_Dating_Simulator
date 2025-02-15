import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [judgeFeedback, setJudgeFeedback] = useState('');
  const [judgeScores, setJudgeScores] = useState({
    chemistry: 5,
    engagement: 5,
    authenticity: 5
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const chars = location.state?.characters || JSON.parse(localStorage.getItem('characters'));
    if (!chars) {
      navigate('/');
      return;
    }
    setCharacters(chars);
    // Start initial conversation
    generateResponse();
  }, []);

  const generateResponse = async () => {
    if (isGenerating) return;
    
    try {
      setIsGenerating(true);
      const response = await axios.post('http://localhost:5000/generate-response', {
        characters,
        conversation,
        judgeFeedback,
        judgeScores
      });

      setConversation(prev => [...prev, 
        { 
          sender: characters.character1.name, 
          text: response.data.character1Response,
          character: 'character1'
        },
        { 
          sender: characters.character2.name, 
          text: response.data.character2Response,
          character: 'character2'
        }
      ]);
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate new responses when judge feedback changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (characters && (judgeFeedback || Object.values(judgeScores).some(score => score !== 5))) {
        generateResponse();
      }
    }, 1000); // Wait 1 second after changes before generating new responses

    return () => clearTimeout(debounce);
  }, [judgeFeedback, judgeScores]);

  return (
    <div className="grid grid-cols-[1fr_400px] gap-6 p-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Chat Section */}
      <Card className="chat-main">
        <CardHeader>
          <CardTitle className="text-[#C00000] text-center">
            AI Soap Opera - Live Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="chat-messages h-[calc(100vh-200px)] overflow-y-auto p-4 space-y-4">
            {conversation.map((msg, idx) => (
              <div 
                key={idx} 
                className={`message-bubble ${msg.character}-message animate-slideIn`}
              >
                <span className="font-bold text-[#FF3334]">{msg.sender}:</span>
                <p className="mt-1">{msg.text}</p>
              </div>
            ))}
            {isGenerating && (
              <div className="text-center text-[#FF6F77] animate-pulse">
                Generating responses...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Judge Panel */}
      <Card className="judge-panel">
        <CardHeader>
          <CardTitle className="text-[#C00000]">Judge Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Sliders */}
          {Object.entries(judgeScores).map(([category, score]) => (
            <div key={category} className="space-y-2">
              <label className="block text-sm font-medium text-[#FF3334]">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={score}
                  onChange={(e) => setJudgeScores(prev => ({
                    ...prev,
                    [category]: parseInt(e.target.value)
                  }))}
                  className="flex-1 accent-[#FF6F77]"
                />
                <span className="text-sm font-medium w-8">{score}/10</span>
              </div>
            </div>
          ))}

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#FF3334]">
              Judge Feedback
            </label>
            <textarea 
              value={judgeFeedback}
              placeholder="Provide feedback to influence the conversation..."
              className="w-full h-32 p-3 border-2 border-[#FF6F77] rounded-lg 
                       focus:border-[#FF3334] focus:outline-none resize-none"
              onChange={(e) => setJudgeFeedback(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Chat;