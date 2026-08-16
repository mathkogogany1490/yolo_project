import {
    HeaderActions,
    HeaderBar as HeaderBarRoot,
    HeaderButton,
    HeaderTitle,
} from './HeaderBar.styles';

export function HeaderBar({ loggedIn, onLogin, onRegister, onLogout }) {
    return (
        <HeaderBarRoot>
            <HeaderTitle>MyHome</HeaderTitle>
            <HeaderActions>
                {loggedIn ? (
                    <HeaderButton type="button" onClick={onLogout}>
                        Logout
                    </HeaderButton>
                ) : (
                    <>
                        <HeaderButton type="button" onClick={onLogin}>
                            Login
                        </HeaderButton>
                        <HeaderButton type="button" onClick={onRegister}>
                            Register
                        </HeaderButton>
                    </>
                )}
            </HeaderActions>
        </HeaderBarRoot>
    );
}