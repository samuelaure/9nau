"use client";

import * as React from 'react';
import { useCreateBlock } from '@/hooks/use-blocks-api';
import { Card } from '@9nau/ui/components/card';
import { Button } from '@9nau/ui/components/button';

export function NoteInput() {
    const [isExpanded, setExpanded] = React.useState(false);
    const [text, setText] = React.useState('');
    const formRef = React.useRef<HTMLFormElement>(null);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

    const createBlock = useCreateBlock();

    React.useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = 'auto';
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [text]);

    const handleCancel = () => {
        setText('');
        setExpanded(false);
    };

    const handleSubmit = () => {
        if (text.trim()) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const dateInUserTimeZone = `${year}-${month}-${day}`;

            createBlock.mutate({
                type: 'note',
                properties: { text: text.trim(), status: 'inbox', date: dateInUserTimeZone },
            });
        }
        handleCancel();
    };
    
    React.useEffect(() => { 
        const handleClickOutside = (event: MouseEvent) => { 
            if (formRef.current && !formRef.current.contains(event.target as Node)) {
                handleSubmit();
            } 
        };
        document.addEventListener('mousedown', handleClickOutside); 
        return () => document.removeEventListener('mousedown', handleClickOutside); 
    }, [formRef.current, text]);

    if (!isExpanded) {
        return (
            <div className="max-w-xl mx-auto mb-8">
                <Card 
                    className="p-3 cursor-text text-gray-500" 
                    onClick={() => setExpanded(true)}
                >
                    Take a note...
                </Card>
            </div>
        );
    }
    
    return (
        <div className="max-w-xl mx-auto mb-8">
            <form ref={formRef} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="bg-card rounded-lg shadow-lg border">
                <div className="p-4">
                    <textarea 
                        ref={textAreaRef}
                        value={text} 
                        onChange={(e) => setText(e.target.value)} 
                        placeholder="Take a note..."
                        className="w-full resize-none outline-none text-base bg-transparent"
                        style={{ maxHeight: '70vh' }}
                        rows={1}
                        autoFocus
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                        <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
                        <Button type="submit" variant="ghost">Done</Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
