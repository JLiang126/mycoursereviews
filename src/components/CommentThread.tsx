'use client';

import { Button, Textarea } from '@heroui/react';
import { useState, useTransition } from 'react';
import { clsx } from 'clsx';
import { FaEdit, FaReply, FaTrashAlt } from 'react-icons/fa';
import { formatLocalDate } from '@/lib/date-utils';

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    content: string;
    parentId: string | null;
    createdAt: Date;
}

interface CommentThreadProps {
    reviewId: string;
    commentsList: Comment[];
    parentId?: string | null;
    depth?: number;
    session: any;
    onCommentSubmit: (reviewId: string, content: string, parentId?: string) => Promise<void>;
    onCommentEdit: (commentId: string, content: string) => Promise<void>;
    onCommentDelete: (commentId: string) => Promise<void>;
}

export const CommentThread = ({
    reviewId,
    commentsList,
    parentId = null,
    depth = 0,
    session,
    onCommentSubmit,
    onCommentEdit,
    onCommentDelete,
}: CommentThreadProps) => {
    const [actionTransition, startActionTransition] = useTransition();

    // Local reply/edit states
    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');

    const filtered = commentsList.filter((c) => c.parentId === parentId);
    if (filtered.length === 0) return null;

    const handleReplySubmit = (commentId: string) => {
        if (!replyContent.trim()) return;
        startActionTransition(async () => {
            try {
                await onCommentSubmit(reviewId, replyContent, commentId);
                setActiveReplyId(null);
                setReplyContent('');
            } catch (err: any) {
                alert(err.message || 'Failed to submit reply');
            }
        });
    };

    const handleEditSubmit = (commentId: string) => {
        if (!editingContent.trim()) return;
        startActionTransition(async () => {
            try {
                await onCommentEdit(commentId, editingContent);
                setEditingCommentId(null);
                setEditingContent('');
            } catch (err: any) {
                alert(err.message || 'Failed to edit comment');
            }
        });
    };

    const handleDeleteClick = (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        startActionTransition(async () => {
            try {
                await onCommentDelete(commentId);
            } catch (err: any) {
                alert(err.message || 'Failed to delete comment');
            }
        });
    };

    return (
        <div className={clsx('flex flex-col gap-3 mt-3', depth > 0 && 'border-l-3 border-foreground pl-4 sm:pl-6')}>
            {filtered.map((comment) => (
                <div key={comment.id} className="text-xs flex flex-col gap-1.5 bg-background p-3 rounded-none border-2 border-foreground shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
                    <div className="flex justify-between items-center text-foreground/60 font-mono text-[10px] uppercase font-black">
                        <span className="text-red font-extrabold">{comment.userName}</span>
                        <span>{formatLocalDate(comment.createdAt)}</span>
                    </div>
                    
                    {editingCommentId === comment.id ? (
                        <div className="flex flex-col gap-2 mt-2">
                            <Textarea
                                size="sm"
                                radius="none"
                                value={editingContent}
                                onValueChange={setEditingContent}
                                minRows={1}
                                className="font-mono w-full text-xs"
                                classNames={{
                                    inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                    input: "placeholder:text-grey text-foreground",
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    radius="none"
                                    variant="flat"
                                    onPress={() => setEditingCommentId(null)}
                                    className="font-mono text-2xs uppercase border border-foreground cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    radius="none"
                                    isLoading={actionTransition}
                                    onPress={() => handleEditSubmit(comment.id)}
                                    className="font-mono text-2xs uppercase font-black bg-yellow text-black border border-foreground shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <p className="font-mono text-sm font-bold text-foreground leading-snug tracking-tight">{comment.content}</p>
                    )}
                    
                    {/* Reply & Moderate Actions */}
                    <div className="flex flex-wrap gap-2 justify-start mt-2">
                        {session && editingCommentId !== comment.id && (
                            <Button
                                size="sm"
                                variant="flat"
                                radius="none"
                                startContent={<FaReply className="text-2xs" />}
                                onPress={() => {
                                    setActiveReplyId(comment.id);
                                    setReplyContent('');
                                }}
                                className="h-6 font-mono text-[9px] uppercase font-black bg-background border border-foreground shadow-[1px_1px_0px_0px_#000] py-0.5 px-1.5 text-foreground cursor-pointer"
                            >
                                Reply
                            </Button>
                        )}

                        {session && session.user.id === comment.userId && editingCommentId !== comment.id && (
                            <Button
                                size="sm"
                                variant="flat"
                                radius="none"
                                isIconOnly
                                onPress={() => {
                                    setEditingCommentId(comment.id);
                                    setEditingContent(comment.content);
                                }}
                                className="h-6 w-6 min-w-6 font-mono text-[9px] uppercase font-black bg-background border border-foreground shadow-[1px_1px_0px_0px_#000] p-0 text-foreground cursor-pointer flex items-center justify-center"
                                title="Edit Comment"
                                aria-label="Edit Comment"
                            >
                                <FaEdit className="w-3 h-3 text-black dark:text-yellow" />
                            </Button>
                        )}

                        {session && (session.user.id === comment.userId || session.user.role === 'admin') && editingCommentId !== comment.id && (
                            <Button
                                size="sm"
                                variant="flat"
                                radius="none"
                                color="danger"
                                isIconOnly
                                onPress={() => handleDeleteClick(comment.id)}
                                className="h-6 w-6 min-w-6 font-mono text-[9px] uppercase font-black bg-background text-red border border-red hover:bg-red hover:text-white shadow-[1px_1px_0px_0px_#000] p-0 cursor-pointer flex items-center justify-center"
                                title="Delete Comment"
                                aria-label="Delete Comment"
                            >
                                <FaTrashAlt className="w-3 h-3 text-red-500 hover:text-white" />
                            </Button>
                        )}
                    </div>

                    {/* Inline Reply Input Box */}
                    {activeReplyId === comment.id && (
                        <div className="flex flex-col gap-2 mt-2">
                            <Textarea
                                size="sm"
                                radius="none"
                                placeholder={`Reply to ${comment.userName}...`}
                                value={replyContent}
                                onValueChange={setReplyContent}
                                minRows={1}
                                className="font-mono w-full"
                                classNames={{
                                    inputWrapper: "border-2 border-foreground bg-background rounded-none shadow-none group-data-[focus=true]:border-foreground",
                                    input: "placeholder:text-grey text-foreground",
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <Button
                                    size="sm"
                                    radius="none"
                                    variant="flat"
                                    onPress={() => setActiveReplyId(null)}
                                    className="font-mono text-2xs uppercase border border-foreground cursor-pointer"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    radius="none"
                                    isLoading={actionTransition}
                                    onPress={() => handleReplySubmit(comment.id)}
                                    className="font-mono text-2xs uppercase font-black bg-blue text-black border border-foreground shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                                >
                                    Reply
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Render Nested Children */}
                    <CommentThread
                        reviewId={reviewId}
                        commentsList={commentsList}
                        parentId={comment.id}
                        depth={depth + 1}
                        session={session}
                        onCommentSubmit={onCommentSubmit}
                        onCommentEdit={onCommentEdit}
                        onCommentDelete={onCommentDelete}
                    />
                </div>
            ))}
        </div>
    );
};
