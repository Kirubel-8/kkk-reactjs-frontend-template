// import { useState, createContext, useContext } from "react";

// const stateContext = createContext({
//   user: null,
//   token: null,
//   setUser: () => { },
//   setToken: () => { },
// });

// export const ContextProvider = ({ children }) => {
//   const [user, _setUser] = useState(() => {
//     const savedUser = localStorage.getItem("user");
//     return savedUser ? JSON.parse(savedUser) : null;
//   });

//   const [token, _setToken] = useState(localStorage.getItem("userToken"));

//   const setUser = (user) => {
//     _setUser(user);
//     if (user) {
//       localStorage.setItem("user", JSON.stringify(user));
//     } else {
//       localStorage.removeItem("user");
//     }
//   };

//   const setToken = (token) => {
//     _setToken(token);
//     if (token) {
//       localStorage.setItem("userToken", token);
//     } else {
//       localStorage.removeItem("userToken");
//     }
//   };

//   return (
//     <stateContext.Provider value={{ user, token, setUser, setToken }}>
//       {children}
//     </stateContext.Provider>
//   );
// };

// export const useStateContext = () => useContext(stateContext);

import { useState, createContext, useContext } from "react";

const stateContext = createContext({
  user: null,
  token: null,
  setUser: () => {},
  setToken: () => {},
});

export const ContextProvider = ({ children }) => {
  const [user, _setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, _setToken] = useState(() => {
    return localStorage.getItem("userToken");
  });

  const setUser = (user) => {
    _setUser(user);

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  const setToken = (token) => {
    _setToken(token);

    if (token) {
      localStorage.setItem("userToken", token);
    } else {
      localStorage.removeItem("userToken");
    }
  };

  return (
    <stateContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
      }}
    >
      {children}
    </stateContext.Provider>
  );
};

export const useStateContext = () => useContext(stateContext);
