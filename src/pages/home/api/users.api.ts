import { IUserUpdateDTO } from "@/entities/userUpdateDTO.entity"

export const getAvailableUsers = async (token: string) => {
    const result = await fetch(`${import.meta.env.VITE_DOMAIN_HTTPS}/api/user/available-users`,
        {
            headers: {Authorization: `Bearer ${token}`}
        }
    ).then(data => data.json())
        
    return result
}

export const updateUser = async (token: string, userData: IUserUpdateDTO) => {
    const result = await fetch(`${import.meta.env.VITE_DOMAIN_HTTPS}/api/update/user?userId=${userData.id}`,
        {
            method: 'PUT',
            headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
            body: JSON.stringify(userData)
        }
    ).then(data => data.json())

    return result
}