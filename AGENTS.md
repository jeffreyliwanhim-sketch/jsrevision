<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- UI strings live in src/lib/i18n.tsx dictionaries (en, zh-Hant, zh-Hans); add every new string to all three — keeps the language switcher complete.
- AI quiz generation runs in a createServerFn (src/lib/quiz.functions.ts) with helpers in src/lib/ai/*.server.ts — keeps the AI key and prompts server-side.
- User files go in the private "materials" bucket under `<user_id>/...` — storage policies scope access by that folder.
