import { Outlet } from "react-router-dom";
import NavMenu from "./NavMenu";
 
const Layout = () => {
    return (
        <>
            <Outlet />
            <NavMenu/>
        </>
    )

}

export { Layout }
