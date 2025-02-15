import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import ReactFlow, { Node, Edge, MarkerType, Position } from 'reactflow';
import dagre from 'dagre';
import gsap from 'gsap';
import RabbitFlow from './RabbitFlow';
import MainNode from './nodes/MainNode';
import '../styles/search.css';
import { searchRabbitHole } from '../services/api';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 600;
const nodeHeight = 800;
const questionNodeWidth = 300;
const questionNodeHeight = 100;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ 
    rankdir: 'LR', 
    nodesep: 800,
    ranksep: 500,
    marginx: 100,
    align: 'DL',
    ranker: 'tight-tree'
  });

  const allNodes = dagreGraph.nodes();
  allNodes.forEach(node => dagreGraph.removeNode(node));

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: node.id === 'main' ? nodeWidth : questionNodeWidth,
      height: node.id === 'main' ? nodeHeight : questionNodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.id === 'main' ? nodeWidth / 2 : questionNodeWidth / 2),
        y: nodeWithPosition.y - (node.id === 'main' ? nodeHeight / 2 : questionNodeHeight / 2)
      },
      targetPosition: Position.Left,
      sourcePosition: Position.Right
    };
  });

  return { nodes: newNodes, edges };
};

interface Source {
  title: string;
  url: string;
  uri: string;
  author: string;
  image: string;
}

interface ImageData {
  url: string;
  thumbnail: string;
  description: string;
}

interface SearchResponse {
  response: string;
  followUpQuestions: string[];
  sources: Source[];
  images: ImageData[];
  contextualQuery: string;
}

interface ConversationMessage {
  user?: string;
  assistant?: string;
}

const nodeTypes = {
  mainNode: MainNode,
};

const useDeckHoverAnimation = (deckRef: React.RefObject<HTMLDivElement>) => {
  useEffect(() => {
    if (!deckRef.current) return;

    const deck = deckRef.current;
    const symbol = deck.querySelector('svg');
    const card = deck.querySelector('.card-content');
    let floatingAnimation: gsap.core.Timeline;

    gsap.set(symbol, { scale: 1 });
    gsap.set(card, { 
      y: 0, 
      rotate: 0,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    });

    const createFloatingAnimation = () => {
      const timeline = gsap.timeline({
        repeat: -1,
        yoyo: true,
        defaults: { duration: 2, ease: "power1.inOut" }
      });

      const randomRotation = (Math.random() - 0.5) * 10;
      
      timeline
        .to(card, {
          y: -15,
          x: 5,
          rotate: randomRotation,
          boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.3)',
          duration: 2
        })
        .to(card, {
          y: -10,
          x: -5,
          rotate: -randomRotation,
          boxShadow: '0 15px 25px -8px rgba(0, 0, 0, 0.25)',
          duration: 2
        })
        .to(card, {
          y: -20,
          x: 0,
          rotate: 0,
          boxShadow: '0 25px 35px -12px rgba(0, 0, 0, 0.35)',
          duration: 2
        });

      timeline
        .to(symbol, {
          scale: 1.1,
          rotate: 5,
          duration: 3,
          ease: "none"
        }, 0)
        .to(symbol, {
          scale: 1.15,
          rotate: -5,
          duration: 3,
          ease: "none"
        }, 3);

      return timeline;
    };

    const onHover = () => {
      if (floatingAnimation) {
        floatingAnimation.kill();
      }

      floatingAnimation = createFloatingAnimation();
      
      gsap.to(card, {
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 255, 255, 0.1)',
        duration: 0.5
      });

      deck.classList.add('particles-active');
    };

    const onHoverOut = () => {
      if (floatingAnimation) {
        floatingAnimation.kill();
      }

      gsap.to(symbol, {
        scale: 1,
        rotate: 0,
        duration: 0.5,
        ease: 'power2.out'
      });

      gsap.to(card, {
        y: 0,
        x: 0,
        rotate: 0,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        duration: 0.5,
        ease: 'power2.out',
        clearProps: 'all' // Clear all applied properties
      });

      deck.classList.remove('particles-active');
    };

    deck.addEventListener('mouseenter', onHover);
    deck.addEventListener('mouseleave', onHoverOut);

    return () => {
      if (floatingAnimation) {
        floatingAnimation.kill();
      }
      deck.removeEventListener('mouseenter', onHover);
      deck.removeEventListener('mouseleave', onHoverOut);
    };
  }, [deckRef]);
};

const SearchView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentConcept, setCurrentConcept] = useState<string>('');

  const thothDeckRef = useRef<HTMLDivElement>(null);
  const anubisDeckRef = useRef<HTMLDivElement>(null);
  const isisDeckRef = useRef<HTMLDivElement>(null);

  useDeckHoverAnimation(thothDeckRef);
  useDeckHoverAnimation(anubisDeckRef);
  useDeckHoverAnimation(isisDeckRef);

  const handleNodeClick = async (node: Node) => {
    if (!node.id.startsWith('question-') || node.data.isExpanded) return;

    const questionText = node.data.label;
    setIsLoading(true);

    try {
      const lastMainNode = nodes.find(n => n.type === 'mainNode');
      if (lastMainNode) {
        const newHistoryEntry: ConversationMessage = {
          user: lastMainNode.data.label,
          assistant: lastMainNode.data.content
        };
        setConversationHistory(prev => [...prev, newHistoryEntry]);
      }

      const loadingNodes = nodes.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            type: 'mainNode',
            style: {
              ...n.style,
              width: nodeWidth,
              height: nodeHeight
            },
            data: { ...n.data, isExpanded: true }
          };
        }
        return n;
      });

      setNodes(loadingNodes);

      const response = await searchRabbitHole({
        query: questionText,
        previousConversation: conversationHistory,
        concept: currentConcept,
        followUpMode: 'expansive'
      });

      const transformedNodes = nodes.map(n => {
        if (n.id === node.id) {
          return {
            ...n,
            type: 'mainNode',
            style: {
              ...n.style,
              width: nodeWidth,
              minHeight: '500px',
              background: '#1a1a1a',
              opacity: 1,
              cursor: 'default' 
            },
            data: {
              label: response.contextualQuery || questionText,
              content: response.response,
              images: response.images?.map((img: ImageData) => img.url),
              sources: response.sources,
              isExpanded: true 
            }
          };
        }
        return n;
      });

      // Create new follow-up nodes for the transformed node
      const newFollowUpNodes: Node[] = response.followUpQuestions.map((question: string, index: number) => ({
        id: `question-${node.id}-${index}`,
        type: 'default',
        data: { 
          label: question,
          isExpanded: false,
          content: '',
          images: [],
          sources: []
        },
        position: { x: 0, y: 0 },
        style: {
          width: questionNodeWidth,
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'left',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer' 
        }
      }));

      const newEdges: Edge[] = newFollowUpNodes.map((_, index) => ({
        id: `edge-${node.id}-${index}`,
        source: node.id,
        target: `question-${node.id}-${index}`,
        style: {
          stroke: 'rgba(248, 248, 248, 0.8)',
          strokeWidth: 1.5
        },
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'rgba(248, 248, 248, 0.8)'
        }
      }));

      const { nodes: finalLayoutedNodes, edges: finalLayoutedEdges } = getLayoutedElements(
        [...transformedNodes, ...newFollowUpNodes],
        [...edges, ...newEdges]
      );

      setNodes(finalLayoutedNodes);
      setEdges(finalLayoutedEdges);
    } catch (error) {
      console.error('Failed to process node click:', error);

      const revertedNodes = nodes.map(n => {
        if (n.id === node.id) {
          return {
            ...node,
            data: {
              ...node.data,
              isExpanded: false
            },
            style: {
              ...node.style,
              opacity: 1
            }
          };
        }
        return n;
      });
      setNodes(revertedNodes);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      const response = await searchRabbitHole({
        query,
        previousConversation: conversationHistory,
        concept: currentConcept,
        followUpMode: 'expansive'
      });
      setSearchResult(response);
      const mainNode: Node = {
        id: 'main',
        type: 'mainNode',
        data: { 
          label: response.contextualQuery || query,
          content: response.response,
          images: response.images?.map((img: ImageData) => img.url),
          sources: response.sources,
          isExpanded: true 
        },
        position: { x: 0, y: 0 },
        style: {
          width: nodeWidth,
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          cursor: 'default' 
        }
      };

      const followUpNodes: Node[] = response.followUpQuestions.map((question: string, index: number) => ({
        id: `question-${index}`,
        type: 'default',
        data: { 
          label: question,
          isExpanded: false,
          content: '',
          images: [],
          sources: []
        },
        position: { x: 0, y: 0 },
        style: {
          width: questionNodeWidth,
          background: '#1a1a1a',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '8px',
          fontSize: '14px',
          textAlign: 'left',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          cursor: 'pointer'
        }
      }));

      const edges: Edge[] = followUpNodes.map((_, index) => ({
        id: `edge-${index}`,
        source: 'main',
        target: `question-${index}`,
        style: { 
          stroke: 'rgba(248, 248, 248, 0.8)', 
          strokeWidth: 1.5
        },
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'rgba(248, 248, 248, 0.8)'
        }
      }));


      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        [mainNode, ...followUpNodes],
        edges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!searchResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="w-full max-w-2xl mx-auto text-center relative">
          <div className="mb-12 animate-float">
            <svg className="w-16 h-16 mx-auto animate-pulse-glow" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              <path d="M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          </div>
          
          <h1 className="font-mystical text-3xl font-light mb-8 text-white opacity-90 tracking-[0.2em] uppercase">
            Seek Knowledge
          </h1>

          <div className="grid grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div 
              ref={thothDeckRef}
              onClick={() => setQuery("What secrets lie in the cosmic patterns of consciousness?")}
              className="group cursor-pointer perspective-1000"
            >
              <div className="card-content relative w-full aspect-[2/3] transform transition-transform duration-500 group-hover:rotate-y-180 preserve-3d">
                <div className="absolute w-full h-full bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-lg flex items-center justify-center backface-hidden">
                  <svg className="w-12 h-12 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 4L8 8M12 4L16 8M12 4V20M4 12H20" strokeWidth="1" />
                  </svg>
                </div>
                <div className="absolute w-full h-full bg-[#111111] border border-white/10 rounded-lg p-4 rotate-y-180 backface-hidden">
                  <div className="text-white/70 text-sm font-light">Deck of Thoth</div>
                </div>
              </div>
            </div>

            <div 
              ref={anubisDeckRef}
              onClick={() => setQuery("What lies beyond the veil between life and death?")}
              className="group cursor-pointer perspective-1000"
            >
              <div className="card-content relative w-full aspect-[2/3] transform transition-transform duration-500 group-hover:rotate-y-180 preserve-3d">
                <div className="absolute w-full h-full bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-lg flex items-center justify-center backface-hidden">
                  <svg className="w-12 h-12 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 3L4 9V21H20V9L12 3Z" strokeWidth="1" />
                    <path d="M8 12H16M8 16H16" strokeWidth="1" />
                  </svg>
                </div>
                <div className="absolute w-full h-full bg-[#111111] border border-white/10 rounded-lg p-4 rotate-y-180 backface-hidden">
                  <div className="text-white/70 text-sm font-light">Deck of Anubis</div>
                </div>
              </div>
            </div>

            <div 
              ref={isisDeckRef}
              onClick={() => setQuery("How does ancient wisdom guide our modern understanding?")}
              className="group cursor-pointer perspective-1000"
            >
              <div className="card-content relative w-full aspect-[2/3] transform transition-transform duration-500 group-hover:rotate-y-180 preserve-3d">
                <div className="absolute w-full h-full bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-lg flex items-center justify-center backface-hidden">
                  <svg className="w-12 h-12 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="8" strokeWidth="1" />
                    <path d="M12 4V2M12 22V20M4 12H2M22 12H20" strokeWidth="1" />
                  </svg>
                </div>
                <div className="absolute w-full h-full bg-[#111111] border border-white/10 rounded-lg p-4 rotate-y-180 backface-hidden">
                  <div className="text-white/70 text-sm font-light">Deck of Isis</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative w-full max-w-xl mx-auto group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2c2c2c] via-[#3c3c3c] to-[#2c2c2c] rounded-full opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-gradient-xy blur-sm"></div>
            <input
              type="text"
              className="w-full px-6 py-4 rounded-full bg-[#111111] text-white/90 border border-white/10 focus:border-white/20 focus:outline-none placeholder-white/30 shadow-lg backdrop-blur-sm font-light tracking-wide"
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask your question..."
              disabled={isLoading}
            />
            {isLoading ? (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border border-white/20 rounded-full animate-spin border-t-white/80"></div>
              </div>
            ) : (
              <button 
                onClick={handleSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full hover:bg-white/5 transition-colors duration-200"
              >
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="mt-8 text-white/40 text-sm font-light tracking-wider animate-pulse-glow">
            VENTURE INTO THE UNKNOWN
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <RabbitFlow 
        initialNodes={nodes} 
        initialEdges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
      />
    </div>
  );
};

export default SearchView; 