export const getAvailbleUsers = async (token: string) => {
    const result = await fetch("http://127.0.0.1:8080/api/user/available-users",
        {
            headers: {Authorization: `Bearer ${token}`}
        }
    ).then(data => data.json())
        
    return result
}