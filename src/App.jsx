import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { Octokit } from "octokit";
import { formatDate } from "date-fns";
import MoonIcon from "./assets/icon-moon.svg?react";
import SunIcon from "./assets/icon-sun.svg?react";
import SearchIcon from "./assets/icon-search.svg?react";
import LocationIcon from "./assets/icon-location.svg?react";
import TwitterIcon from "./assets/icon-twitter.svg?react";
import WebsiteIcon from "./assets/icon-website.svg?react";
import CompanyIcon from "./assets/icon-company.svg?react";
import "./App.css";

const octokit = new Octokit({auth: "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"});

function Header({isDarkMode, setIsDarkMode}) {
 return (
  <header className="header">
   <span className="logo">devfinder</span>
   <button className="mode-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
    <span className="mode-text">{isDarkMode ? "Light" : "Dark"}</span>
    {isDarkMode ? <SunIcon /> : <MoonIcon />}
   </button>
  </header>
 );
}

function Search({onSubmit, numResults}) {
 return (
  <form className="search" onSubmit={onSubmit}>
   <label htmlFor="search-input" className="search-icon">
    <SearchIcon />
   </label>
   <input type="text" className="search-input show-warn" id="search-input" placeholder="Search GitHub username..." />
   <span className={`search-results ${numResults === 0 ? "show" : ""}`}>No results</span>
   <button type="submit" className="search-btn">Search</button>
  </form>
 )
}

function MiscItem({icon, available, children}) {
 return (
  <div className={`misc-item ${available ? "" : "unavailable"}`}>
   {icon}
   <span className="misc-item__text">{available ? children : "Not Available"}</span>
  </div>
 )
}

function UserStats({stats}) {
 return (
   <ul className="user-stats">
    {
     Object.entries(stats).map(([name, number]) => (
      <li className="stats-item" key={name}>
       <div className="stat-name">{name}</div>
       <div className="stat-number">{number}</div>
      </li>
     ))
    }
   </ul>
 )
}

function UserCard({user}) {
 const matches = useMediaQuery({query: "(max-width: 600px)"});
 const userStats = {
  repos: user.public_repos,
  followers: user.followers,
  following: user.following,
 };
 
 return (
  <div className="user-card">
   { !matches ?
    <div className="pfp-container">
     <img src={user.avatar_url} alt="username" className="pfp" />
    </div> : null
   }
   <div className="user-desc">
    <div className="user-namedate">
      { matches ?
       <div className="pfp-container">
        <img src={user.avatar_url} alt="username" className="pfp" />
       </div> : null
      }
     <div className="user-name">
      <div className="user-name__screen-name">{user.name}</div>
      <div className="user-name__handle">@{user.login}</div>
      { matches ? <div className="user-date">Joined {formatDate(new Date(user.created_at), "dd MMM yyyy")}</div> : null}
     </div>
     { !matches ? <div className="user-date">Joined {formatDate(new Date(user.created_at), "dd MMM yyyy")}</div> : null}
    </div>
    <div className={`user-bio ${user.bio ? "" : "unavailable"}`}>
     {user.bio ?? "This profile has no bio..."}
    </div>
    <UserStats stats={userStats} />
    <div className="user-misc">
     <MiscItem icon={<LocationIcon />} available={user.location}>
      {user.location}
     </MiscItem>
     <MiscItem icon={<TwitterIcon />} available={user.twitter_username}>
      {user.twitter_username}
     </MiscItem>
     <MiscItem icon={<WebsiteIcon />} available={user.blog}>
      <a href={user.blog}>{user.blog}</a>
     </MiscItem>
     <MiscItem icon={<CompanyIcon />} available={user.company}>
      <a href="#">{user.company}</a>
     </MiscItem>
    </div>
   </div>
  </div>
 );
}

function NoResults() {
 return (
  <div className="no-results">
   <h2 className="no-results__header">No results found!</h2>
   <p className="no-results__text">We couldn&rsquo;t find any GitHub users matching your search. Please double-check the username and try again.</p>
  </div>
 );
}

async function fetchData(query, setUsers, options = {per_page: 10}) {
 const obj = await octokit.request(`GET /search/users?q=${query}&per_page=${options.per_page}`);
 const results = obj.data.items;
 const newUsers = await Promise.all(results.map(async ({url}) => (await octokit.request(`GET ${url}`)).data));

 setUsers(newUsers);
}

export default function App() {
 const [isDarkMode, setIsDarkMode] = useState(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
 const [users, setUsers] = useState([]);
 const [query, setQuery] = useState("");

 useEffect(() => {
  if (query.length) {
   fetchData(query, setUsers);
  } else {
   fetchData("octocat", setUsers, {per_page: 1});
  }
 }, [query]);
  
 return (
  <div className={`container ${isDarkMode ? "adaptive": ""}`}>
   <Header {...{isDarkMode, setIsDarkMode}}/>
   <Search numResults={query.length ? users.length : -1} onSubmit={e => {
    e.preventDefault();
    
    let query = e.target.elements["search-input"].value;
    setQuery(query);
   }} />
   {
    users.length ? users.map((user, i) => <UserCard key={i} user={user} />) :
    query.length ? <NoResults /> : null
   }
  </div>
  )
}