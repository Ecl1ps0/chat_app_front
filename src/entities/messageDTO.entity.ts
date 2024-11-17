export interface IMessageDTO {
    id?: string;
    message?: string;
    sender_id: string;
    images?: string[];
    audio?: string;
    is_update: boolean;
}