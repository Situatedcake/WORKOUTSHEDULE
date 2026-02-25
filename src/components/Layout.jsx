import { Outlet } from "react-router-dom";
import NavMenu from "./NavMenu";

const Layout = () => {
    return (
        <>
            <main>
                <Outlet />
            </main>
            <NavMenu />
        </>
    )

}

export { Layout }
