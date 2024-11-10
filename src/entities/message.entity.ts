export interface IMessage {
    id: string;
    text_content: string;
    image_content: string[];
    sender: string;
    created_at: number;
    updated_at: number;
}