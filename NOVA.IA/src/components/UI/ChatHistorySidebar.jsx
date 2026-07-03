import React from 'react';
import { Plus, MessageSquare, Trash2, LogOut, GraduationCap, MapPin, X, User } from 'lucide-react';

export default function ChatHistorySidebar({ 
    isOpen, 
    onClose, 
    conversations, 
    activeConversationId, 
    onSelectConversation, 
    onDeleteConversation, 
    onNewConversation, 
    user, 
    onLogout 
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 left-0 z-[25000] w-72 md:w-80 backdrop-blur-3xl bg-slate-950/90 border-r border-white/10 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-all duration-300">
            {}
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-2">
                <button
                    onClick={onNewConversation}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Chat
                </button>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all focus:outline-none"
                    title="Cerrar Panel"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                <h3 className="px-3 text-[10px] font-orbitron font-bold text-slate-500 tracking-widest uppercase mb-2">
                    Conversaciones Previas
                </h3>
                {conversations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 font-rajdhani text-sm tracking-wider">
                        No hay chats previos registrados.
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv.id}
                            className={`group flex items-center justify-between rounded-xl p-3 border font-rajdhani text-sm tracking-wide transition-all ${
                                activeConversationId === conv.id
                                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                                    : 'border-transparent bg-white/0 hover:bg-white/5 text-slate-300 hover:text-white'
                            }`}
                        >
                            <button
                                onClick={() => onSelectConversation(conv.id)}
                                className="flex-1 flex items-center gap-3 text-left overflow-hidden select-none"
                            >
                                <MessageSquare className={`w-4 h-4 shrink-0 ${activeConversationId === conv.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                                <span className="truncate pr-2">{conv.title}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteConversation(conv.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all focus:outline-none"
                                title="Eliminar Chat"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {}
            <div className="p-4 border-t border-white/5 bg-slate-950/40 relative z-10 flex flex-col gap-3">
                {user ? (
                    <>
                        <div className="flex flex-col gap-1.5 font-rajdhani tracking-wider text-xs">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                    <User className="w-3.5 h-3.5" />
                                </div>
                                <span className="truncate">{user.nombre}</span>
                            </div>
                            {user.carrera && (
                                <div className="flex items-center gap-2 text-slate-400 ml-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    <span className="truncate">{user.carrera} ({user.ciclo || 'N/A'})</span>
                                </div>
                            )}
                            {user.sede && (
                                <div className="flex items-center gap-2 text-slate-400 ml-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                    <span>Sede {user.sede}</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={onLogout}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-red-500/20 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-orbitron font-bold text-xs uppercase tracking-wider transition-all duration-300"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Cerrar Sesión
                        </button>
                    </>
                ) : (
                    <div className="text-center text-slate-500 font-rajdhani text-xs py-2 tracking-wider">
                        Inicia sesión para ver tu historial de chats
                    </div>
                )}
            </div>
        </div>
    );
}
