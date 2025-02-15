import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Home() {
  const [currentCharacter, setCurrentCharacter] = useState({
    name: '',
    personality: '',
    hobbies: '',
  });
  const [characters, setCharacters] = useState({
    character1: null,
    character2: null
  });
  const navigate = useNavigate();

  const createCharacter = () => {
    if (!currentCharacter.name) {
      alert('Please fill in the character name');
      return;
    }
    
    if (!characters.character1) {
      setCharacters(prev => ({
        ...prev,
        character1: currentCharacter
      }));
    } else if (!characters.character2) {
      setCharacters(prev => ({
        ...prev,
        character2: currentCharacter
      }));
    }
    
    // Reset current character form
    setCurrentCharacter({ name: '', personality: '', hobbies: '' });
  };

  const startDating = async () => {
    if (!characters.character1 || !characters.character2) {
      alert('Please create both characters first');
      return;
    }
    
    try {
      // Store characters in local storage before navigation
      localStorage.setItem('characters', JSON.stringify(characters));
      
      // Navigate to chat page
      navigate('/chat', { state: { characters } });
    } catch (error) {
      console.error('Error starting date:', error);
      alert('There was an error starting the date. Please try again.');
    }
  };

  return (
    <>
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-center text-[#C00000] mb-8 animate-fadeIn">
          AI Soap Opera
        </h1>
        
        <div className="flex gap-6 max-w-6xl mx-auto">
          {/* Character Creation Section */}
          <div className="w-1/2">
            <Card className="mb-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-[#FF3334]">Create New Character</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Name" 
                    value={currentCharacter.name}
                    className="border p-2 w-full rounded-md"
                    onChange={(e) => setCurrentCharacter(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                  />
                  <input 
                    type="text" 
                    placeholder="Personality" 
                    value={currentCharacter.personality}
                    className="border p-2 w-full rounded-md"
                    onChange={(e) => setCurrentCharacter(prev => ({
                      ...prev,
                      personality: e.target.value
                    }))}
                  />
                  <input 
                    type="text" 
                    placeholder="Hobbies (comma separated)" 
                    value={currentCharacter.hobbies}
                    className="border p-2 w-full rounded-md"
                    onChange={(e) => setCurrentCharacter(prev => ({
                      ...prev,
                      hobbies: e.target.value
                    }))}
                  />
                  <Button 
                    onClick={createCharacter}
                    className="w-full bg-[#FF6F77] hover:bg-[#FF3334] text-white"
                  >
                    Create Character
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={startDating} 
              className="w-48 bg-[#FF3334] hover:bg-[#C00000] text-white animate-fadeIn"
              disabled={!characters.character1 || !characters.character2}
              style={{ animationDelay: '0.4s' }}
            >
              Start Dating
            </Button>
          </div>

          {/* Preview Section */}
          <div className="w-1/2 space-y-6 overflow-hidden">
            {characters.character1 && (
              <Card className="transform animate-slideIn" style={{ animationDelay: '0.1s' }}>
                <CardHeader>
                  <CardTitle className="text-[#FF3334]">Character 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {characters.character1.name}</p>
                    <p><strong>Personality:</strong> {characters.character1.personality}</p>
                    <p><strong>Hobbies:</strong> {characters.character1.hobbies}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {characters.character2 && (
              <Card className="transform animate-slideIn" style={{ animationDelay: '0.2s' }}>
                <CardHeader>
                  <CardTitle className="text-[#FF3334]">Character 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {characters.character2.name}</p>
                    <p><strong>Personality:</strong> {characters.character2.personality}</p>
                    <p><strong>Hobbies:</strong> {characters.character2.hobbies}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;