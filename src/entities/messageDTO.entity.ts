export interface IMessageDTO {
    id?: string;
    message: string;
    sender_id: string;
    images: string[];
    is_update: boolean;
}