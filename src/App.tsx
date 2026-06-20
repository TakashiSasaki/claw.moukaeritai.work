import { useEffect, useState } from 'react';
import { auth, db, loginWithGoogle, loginAnonymously, logout } from './lib/firebase';
import { collection, query, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { Laptop, Activity, Power, Trash2, Send, Server, LogOut, CheckCircle2, XCircle } from 'lucide-react';

interface NodeData {
  id: string;
  status: string;
  version: string;
  ip_address: string;
  current_task: string;
  telegram_url: string;
  last_seen: Timestamp | null;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingContext(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setNodes([]);
      return;
    }

    const q = query(collection(db, 'nodes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNodes: NodeData[] = [];
      snapshot.forEach((docSnap) => {
        fetchedNodes.push({ id: docSnap.id, ...docSnap.data() } as NodeData);
      });
      setNodes(fetchedNodes);
    }, (error) => {
      console.error("Error fetching nodes:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (nodeId: string) => {
    if (!confirm(`Are you sure you want to delete node ${nodeId}?`)) return;
    try {
      await deleteDoc(doc(db, 'nodes', nodeId));
    } catch (err) {
      console.error("Failed to delete node:", err);
      alert("Failed to delete node.");
    }
  };

  const isOffline = (lastSeen: Timestamp | null) => {
    if (!lastSeen) return true;
    const now = new Date();
    const lastSeenDate = lastSeen.toDate();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    return diffMs > 3 * 60 * 1000; // 3 minutes
  };

  if (loadingContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        <Activity className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 text-slate-800">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <Server size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">OpenClaw Dashboard</h1>
          <p className="text-slate-500 text-center mb-8">Sign in to monitor your gateway nodes across the cloud.</p>
          
          <button
            onClick={loginWithGoogle}
            className="w-full mb-3 flex items-center justify-center bg-white border border-slate-300 text-slate-700 py-3 rounded-xl hover:bg-slate-50 font-medium transition-all shadow-sm active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 mr-3" />
            Sign in with Google
          </button>
          <button
            onClick={loginAnonymously}
            className="w-full flex items-center justify-center bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 font-medium transition-all shadow-md active:scale-[0.98]"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <Server size={18} />
            </div>
            <h1 className="font-bold text-lg hidden sm:block">OpenClaw Gateway</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-500 hidden sm:block bg-slate-100 px-3 py-1 rounded-full">
              {user.isAnonymous ? 'Guest User' : user.email}
            </span>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center"
              title="Sign Out"
            >
              <LogOut size={18} className="sm:mr-2" />
              <span className="hidden sm:inline font-medium">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Active Nodes</h2>
          <div className="bg-white rounded-lg border border-slate-200 px-4 py-2 flex items-center shadow-sm">
            <Activity className="text-blue-500 mr-2" size={18} />
            <span className="font-semibold">{nodes.length}</span>
            <span className="ml-1 text-slate-500 text-sm font-medium">total</span>
          </div>
        </div>

        {nodes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400 shadow-sm">
            <Power size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium text-slate-500 mb-2">No nodes connected</p>
            <p className="text-sm">Start an OpenClaw plugin to see it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {nodes.map(node => {
              const offline = isOffline(node.last_seen);
              return (
                <div 
                  key={node.id} 
                  className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden flex flex-col ${offline ? 'border-red-200 opacity-80' : 'border-slate-200 hover:shadow-md hover:border-blue-200'}`}
                >
                  <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl flex-shrink-0 ${offline ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        <Laptop size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 truncate pr-4">{node.id}</h3>
                        <div className="flex items-center text-xs font-semibold mt-1">
                          {offline ? (
                            <span className="flex items-center text-red-500"><XCircle size={12} className="mr-1" /> OFFLINE</span>
                          ) : (
                            <span className="flex items-center text-emerald-500"><CheckCircle2 size={12} className="mr-1" /> ONLINE</span>
                          )}
                          <span className="mx-2 text-slate-300">•</span>
                          <span className="text-slate-500 font-medium">v{node.version || '1.0.0'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(node.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      title="Remove Node"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Current Task</p>
                        <p className="font-medium text-slate-800 capitalize truncate" title={node.current_task}>{node.current_task || 'Idle'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Local IP</p>
                        <p className="font-medium text-slate-800 font-mono text-sm">{node.ip_address || 'Unknown'}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                       <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">Last Seen</p>
                       <p className="text-sm font-medium text-slate-600">
                         {node.last_seen ? formatDistanceToNow(node.last_seen.toDate(), { addSuffix: true }) : 'Never'}
                       </p>
                    </div>
                  </div>

                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 mt-auto">
                    {node.telegram_url ? (
                      <a 
                        href={node.telegram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-xl font-semibold text-sm transition-colors"
                      >
                         <Send size={16} />
                         <span>Open Telegram</span>
                      </a>
                    ) : (
                      <button 
                        disabled
                        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-slate-100 text-slate-400 rounded-xl font-semibold text-sm cursor-not-allowed"
                      >
                         <Send size={16} />
                         <span>No Telegram Link</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
