import { IUserDTO } from "@/entities/userDTO.entity";

export const handleAuth = async (values: any, isRegistration: boolean) => {
    const user = values as IUserDTO;
    const url = `http://localhost:8080/api/auth/${isRegistration ? "sign-up" : "sign-in"}`

    const result = await fetch(url, {
        method: "POST",
        body: JSON.stringify(user),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    }).then(data => data.json()).catch(console.log)

    return result
}
 