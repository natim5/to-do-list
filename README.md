# Daymark — Todo List

A simple, responsive task manager built with HTML, CSS, and JavaScript. Create tasks, keep notes, set due dates and priorities, track completion, and find tasks with search and filters.

## Features

- Starts empty, with no sample tasks
- Create, view, edit, complete, and delete tasks
- Optional notes, due dates, and priority levels
- All, Today, Upcoming, and Completed views
- Search, priority filtering, and sorting
- Clear completed tasks or delete all saved tasks
- Saves tasks in browser `localStorage`; data persists after refresh
- Responsive design for mobile and desktop
- No package installation, account, or backend required
- GitHub Pages deployment through GitHub Actions
- A root `sitemap.xml`, plus a deployment-generated sitemap and `robots.txt` using the configured Pages URL

## Run locally

Open `index.html` in a modern browser. Or run `python3 -m http.server 8000` in this folder and visit <http://localhost:8000>.

## Data storage

Tasks are saved in the current browser on the current device. They are not uploaded to a server. Browser data clearing, another browser, or another device will not include the saved tasks.

## Publish and host with GitHub Pages

Create a new repository on GitHub, then push this folder to its `main` branch. The included workflow builds the static site and deploys it to GitHub Pages whenever you push to `main`.

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git add .
git commit -m "Build Daymark todo list"
git push -u origin main
```

In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. Then check the **Actions** tab for the deployment. The workflow generates `sitemap.xml` and `robots.txt` using GitHub's configured Pages base URL, so it works with either a user site or a repository subpath. The deployed sitemap is available at `<your-pages-url>/sitemap.xml`.

To build the site locally, run `python3 scripts/build_site.py https://YOUR-USERNAME.github.io/YOUR-REPOSITORY`. The generated website files are placed in `dist/`.

## License

MIT. See [LICENSE](LICENSE).
