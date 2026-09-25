import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment, Annotation, StateEffect, StateField } from '@codemirror/state';
import { Decoration, WidgetType } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { langageDe } from './arbre';

// L'éditeur de l'atelier : CodeMirror 6 (licence MIT), choisi dans le plan
// parce qu'il marche au doigt sur téléphone (Monaco ne le fait pas).
// Les couleurs sont celles de Léo (bleu nuit, laiton), pas un thème importé.

const LANGAGES = {
  js: () => javascript({ jsx: true }),
  ts: () => javascript({ jsx: true, typescript: true }),
  py: () => python(),
  html: () => html(),
  css: () => css(),
  json: () => json(),
  texte: () => [],
};

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#0B1120', color: '#EDF1F8', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', lineHeight: '1.55' },
  '.cm-content': { caretColor: '#E3A857' },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#E3A857' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': { backgroundColor: '#2A3550' },
  '.cm-gutters': { backgroundColor: '#121A2B', color: '#93A1B8', border: 'none' },
  '.cm-activeLine': { backgroundColor: '#1A233755' },
  '.cm-activeLineGutter': { backgroundColor: '#1A2337', color: '#E3A857' },
}, { dark: true });

// Les couleurs du code, prises dans la palette de Léo (laiton, turquoise,
// terracotta) pour rester lisibles sur le bleu nuit.
const couleurs = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier, tags.controlKeyword], color: '#E3A857' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: '#5FC8C0' },
  { tag: [tags.number, tags.bool, tags.null, tags.atom], color: '#F2C98A' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: '#93A1B8', fontStyle: 'italic' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: '#F2C98A' },
  { tag: [tags.typeName, tags.className, tags.tagName], color: '#E07A55' },
  { tag: [tags.propertyName, tags.attributeName], color: '#C9D4E5' },
  { tag: [tags.variableName, tags.definition(tags.variableName)], color: '#EDF1F8' },
  { tag: tags.invalid, color: '#FB7185' },
]);

// L'AGENT QUI ÉCRIT SOUS NOS YEUX (Beau, 24/09 : « je pensais que les agents
// devaient écrire au milieu, ouvrir les fichiers, taper le code »). Quand le
// texte change parce que l'agent l'a proposé ou écrit, on ne remplace pas
// tout d'un coup : on efface ce qui disparaît et on TAPE ce qui arrive, avec
// un curseur à son nom, et ce qu'il vient d'écrire reste surligné.
const parAgent = Annotation.define();
const poser = StateEffect.define(); // { de, a, curseur } ou null
class Curseur extends WidgetType {
  constructor(nom) { super(); this.nom = nom; }
  eq(o) { return o.nom === this.nom; }
  toDOM() {
    const el = document.createElement('span');
    el.className = 'cm-curseur-agent';
    el.textContent = this.nom;
    return el;
  }
}
const marques = StateField.define({
  create: () => ({ de: 0, a: 0, curseur: null, nom: '' }),
  update(v, tr) {
    let n = tr.docChanged ? { ...v, de: tr.changes.mapPos(v.de, -1), a: tr.changes.mapPos(v.a, 1), curseur: v.curseur == null ? null : tr.changes.mapPos(v.curseur, 1) } : v;
    for (const e of tr.effects) if (e.is(poser)) n = e.value ? { ...n, ...e.value } : { de: 0, a: 0, curseur: null, nom: '' };
    return n;
  },
  provide: (f) => EditorView.decorations.from(f, (v) => {
    const d = [];
    if (v.a > v.de) d.push(Decoration.mark({ class: 'cm-ajout-agent' }).range(v.de, v.a));
    if (v.curseur != null) d.push(Decoration.widget({ widget: new Curseur(v.nom), side: 1 }).range(v.curseur));
    return Decoration.set(d, true);
  }),
});
const themeAgent = EditorView.theme({
  '.cm-ajout-agent': { backgroundColor: 'rgba(95, 200, 192, 0.16)' },
  '.cm-curseur-agent': { display: 'inline-block', marginLeft: '1px', padding: '0 5px', borderLeft: '2px solid #E3A857', borderRadius: '0 4px 4px 0', backgroundColor: '#E3A857', color: '#0B1120', fontSize: '10px', fontWeight: '700', lineHeight: '1.4', verticalAlign: 'text-top', animation: 'cm-clignote 1s steps(2) infinite' },
  '@keyframes cm-clignote': { '50%': { opacity: 0.55 } },
});

export default function Editeur({ chemin, valeur, lectureSeule, onChange, onCurseur, auteur = null }) {
  const hote = useRef(null);
  const vue = useRef(null);
  const langage = useRef(new Compartment());
  const lecture = useRef(new Compartment());
  const rappel = useRef(onChange);
  rappel.current = onChange;
  const rappelCurseur = useRef(onCurseur);
  rappelCurseur.current = onCurseur;

  useEffect(() => {
    const v = new EditorView({
      parent: hote.current,
      state: EditorState.create({
        doc: valeur ?? '',
        extensions: [
          basicSetup,
          theme,
          syntaxHighlighting(couleurs),
          EditorView.lineWrapping,
          langage.current.of(LANGAGES[langageDe(chemin)]()),
          lecture.current.of(EditorState.readOnly.of(!!lectureSeule)),
          marques,
          themeAgent,
          // Ce que l'agent tape n'est pas un brouillon de Beau : on ne le remonte pas.
          EditorView.updateListener.of((u) => { if (u.docChanged && !u.transactions.some((tr) => tr.annotation(parAgent))) rappel.current?.(u.state.doc.toString()); }),
          // La position du curseur, pour la barre d'état (ligne:colonne).
          EditorView.updateListener.of((u) => {
            if (!u.selectionSet && !u.docChanged) return;
            const tete = u.state.selection.main.head;
            const l = u.state.doc.lineAt(tete);
            rappelCurseur.current?.(l.number, tete - l.from + 1);
          }),
        ],
      }),
    });
    vue.current = v;
    return () => v.destroy();
    // L'éditeur est créé une fois ; les changements passent par les effets ci-dessous.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Un autre fichier : on remplace le texte d'un coup. Le même fichier changé
  // par l'agent (auteur donné) : il le tape sous nos yeux.
  const cheminAvant = useRef(chemin);
  const minuterie = useRef(null);
  useEffect(() => {
    const v = vue.current;
    if (!v) return undefined;
    clearTimeout(minuterie.current);
    const actuel = v.state.doc.toString();
    const cible = valeur ?? '';
    const effets = [langage.current.reconfigure(LANGAGES[langageDe(chemin)]())];
    const autreFichier = cheminAvant.current !== chemin;
    cheminAvant.current = chemin;
    if (cible === actuel) { v.dispatch({ effects: autreFichier ? [...effets, poser.of(null)] : effets }); return undefined; }
    if (autreFichier || !auteur) {
      v.dispatch({ changes: { from: 0, to: actuel.length, insert: cible }, effects: [...effets, poser.of(null)], annotations: parAgent.of(!!auteur) });
      return undefined;
    }
    // Ce qui ne change pas au début et à la fin reste ; le milieu est retapé.
    let p = 0;
    while (p < actuel.length && p < cible.length && actuel[p] === cible[p]) p++;
    let f = 0;
    while (f < actuel.length - p && f < cible.length - p && actuel[actuel.length - 1 - f] === cible[cible.length - 1 - f]) f++;
    const aTaper = cible.slice(p, cible.length - f);
    v.dispatch({
      changes: { from: p, to: actuel.length - f, insert: '' },
      effects: [...effets, poser.of({ de: p, a: p, curseur: p, nom: auteur }), EditorView.scrollIntoView(p, { y: 'center' })],
      annotations: parAgent.of(true),
    });
    // Environ 2 à 4 secondes quelle que soit la taille : on voit écrire sans attendre.
    const pas = Math.max(2, Math.ceil(aTaper.length / 160));
    let fait = 0;
    const taper = () => {
      const morceau = aTaper.slice(fait, fait + pas);
      const ou = p + fait;
      fait += morceau.length;
      const fin = fait >= aTaper.length;
      vue.current?.dispatch({
        changes: { from: ou, insert: morceau },
        effects: [poser.of({ de: p, a: p + fait, curseur: fin ? null : p + fait, nom: auteur }), EditorView.scrollIntoView(p + fait, { y: 'nearest' })],
        annotations: parAgent.of(true),
      });
      if (!fin) minuterie.current = setTimeout(taper, 18);
    };
    if (aTaper) minuterie.current = setTimeout(taper, 250);
    return () => clearTimeout(minuterie.current);
  }, [chemin, valeur, auteur]);

  useEffect(() => {
    vue.current?.dispatch({ effects: lecture.current.reconfigure(EditorState.readOnly.of(!!lectureSeule)) });
  }, [lectureSeule]);

  return <div ref={hote} className="h-full min-h-0 overflow-hidden" />;
}
