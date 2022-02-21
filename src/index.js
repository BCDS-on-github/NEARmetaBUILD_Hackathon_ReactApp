import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Mysterious bullshit sorcery goes here
import { Buffer } from "buffer";
global.Buffer = Buffer;

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC9TMEu9INyvSi8WunDMGgrVX8D88sfWLc",
  authDomain: "nearmetabuild-hackathon.firebaseapp.com",
  projectId: "nearmetabuild-hackathon",
  storageBucket: "nearmetabuild-hackathon.appspot.com",
  messagingSenderId: "459108344073",
  appId: "1:459108344073:web:f674c06c60b07fb66573d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

ReactDOM.render(
  <React.StrictMode>
  	<style>{'body { background-color: #121212; }'}</style>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
