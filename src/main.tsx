import React from "react";
import ReactDOM from "react-dom/client";
import {ThemeProvider} from '@emotion/react';
import {CssBaseline} from '@mui/material';
import App from "./App";
import theme from './theme';
import "./style/styles.css";
import {invoke} from "@tauri-apps/api/core";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline/>
            <App/>
        </ThemeProvider>
    </React.StrictMode>,
);

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        invoke('show').then(() => {
        });
    }, 20)
})
