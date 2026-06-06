import "./Auth.css";
import logo from "./assets/PolyMind-Logo.png";
import { useState, useRef, useEffect } from "react";

function Auth({ onLogin }) {
    const [isLogin,  setIsLogin]  = useState(true);
    const [formData, setFormData] = useState({ username: "", email: "", password: "" });
    const [error,    setError]    = useState("");
    const [loading,  setLoading]  = useState(false);

    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const handleSubmit = async () => {
        setError("");

        if (!formData.email.trim() || !formData.password.trim()) {
            setError("Email and password are required");
            return;
        }
        if (!isLogin && !formData.username.trim()) {
            setError("Username is required");
            return;
        }

        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
            setError("VITE_API_URL is not set. Add it to Frontend/.env");
            return;
        }

        setLoading(true);

        const url  = isLogin ? `${apiUrl}/api/auth/login` : `${apiUrl}/api/auth/register`;
        const body = isLogin
            ? { email: formData.email, password: formData.password }
            : { username: formData.username, email: formData.email, password: formData.password };

        try {
            const response = await fetch(url, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify(body),
            });

            const contentType = response.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                throw new Error(
                    `Server returned HTTP ${response.status}. Is the backend running on ${apiUrl}?`
                );
            }

            const res = await response.json();
            if (!mountedRef.current) return;

            if (res.error) {
                setError(res.error);
            } else {
                localStorage.setItem("token", res.token);
                localStorage.setItem("user",  JSON.stringify(res.user));
                onLogin(res.user);
                return;
            }
        } catch (err) {
            if (!mountedRef.current) return;
            setError(
                err.message.startsWith("Server returned")
                    ? err.message
                    : "Failed to connect to server. Is the backend running?"
            );
        }

        if (mountedRef.current) setLoading(false);
    };

    const handleModeSwitch = () => {
        setIsLogin(!isLogin);
        setError("");
        setFormData({ username: "", email: "", password: "" });
    };

    return (
        <div className="authPage">
            <div className="authBox">
                {/* BUG FIX #4: was <img src="src/assets/blacklogo.png"> — that file
                    doesn't exist. A bare string path also breaks in Vite's production
                    build. Import the asset so Vite fingerprints and bundles it correctly. */}
                <img src={logo} alt="PolyMind logo" className="authLogo" />

                <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
                <p>{isLogin ? "Login to PolyMind" : "Sign up to PolyMind"}</p>

                {!isLogin && (
                    <input
                        type="text"
                        placeholder="Username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                    />
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && !loading && handleSubmit()}
                />

                {error && <p className="authError">{error}</p>}

                <button onClick={handleSubmit} disabled={loading}>
                    {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
                </button>

                <p className="authSwitch">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={handleModeSwitch}>
                        {isLogin ? "Sign Up" : "Login"}
                    </span>
                </p>
            </div>
        </div>
    );
}

export default Auth;
