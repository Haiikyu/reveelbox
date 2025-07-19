\# 🧩 Bibliothèque de Composants ReveelBox



\## Composants de base



\### Button

```jsx

// Usage

<Button variant="primary" size="lg" onClick={handleClick}>

&nbsp; Ouvrir la boîte

</Button>



// Variants: primary, secondary, outline, ghost

// Sizes: sm, md, lg

// Props: disabled, loading, icon, fullWidth

```



\### Card

```jsx

// Usage

<Card hover shadow="soft" className="p-6">

&nbsp; <Card.Header>

&nbsp;   <Card.Title>Titre</Card.Title>

&nbsp; </Card.Header>

&nbsp; <Card.Body>Contenu</Card.Body>

</Card>



// Props: hover, shadow (soft, medium, large), border

```



\### Modal

```jsx

// Usage

<Modal isOpen={open} onClose={setOpen}>

&nbsp; <Modal.Header>Titre</Modal.Header>

&nbsp; <Modal.Body>Contenu</Modal.Body>

&nbsp; <Modal.Footer>

&nbsp;   <Button onClick={setOpen}>Fermer</Button>

&nbsp; </Modal.Footer>

</Modal>

```



\## Composants métier



\### LootBoxCard

```jsx

// Props

{

&nbsp; box: {

&nbsp;   id: string,

&nbsp;   name: string,

&nbsp;   description: string,

&nbsp;   price\_virtual: number,

&nbsp;   price\_real: number,

&nbsp;   image\_url: string

&nbsp; }

}



// Features

\- Animation au hover

\- Affichage prix (coins + €)

\- Badge rareté

\- Lien vers détail

```



\### ItemCard

```jsx

// Props

{

&nbsp; item: {

&nbsp;   id: string,

&nbsp;   name: string,

&nbsp;   rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary',

&nbsp;   image\_url: string,

&nbsp;   market\_value: number

&nbsp; },

&nbsp; showActions?: boolean,

&nbsp; onSell?: () => void

}



// Features

\- Glow effect selon rareté

\- Actions (vendre, voir détails)

\- Badge quantité si > 1

```



\### OpeningAnimation

```jsx

// Props

{

&nbsp; isOpen: boolean,

&nbsp; onComplete: () => void,

&nbsp; obtainedItem: Item | null

}



// Phases

1\. Fade in overlay

2\. Box rotation animation

3\. Explosion particles

4\. Item reveal avec glow

5\. Call onComplete

```



\### CurrencyDisplay

```jsx

// Props

{

&nbsp; amount: number,

&nbsp; type: 'coins' | 'points' | 'euros',

&nbsp; showIcon?: boolean,

&nbsp; animate?: boolean

}



// Features

\- Format nombres (1,234)

\- Animation changement valeur

\- Couleurs selon type

```



\## Layouts



\### AuthLayout

```jsx

// Pour pages login/signup

<AuthLayout

&nbsp; title="Connexion"

&nbsp; subtitle="Accédez à votre compte"

>

&nbsp; {children}

</AuthLayout>



// Features

\- Background gradient

\- Card centrée

\- Logo

```



\### DashboardLayout

```jsx

// Pour pages connectées

<DashboardLayout

&nbsp; sidebar={<Sidebar />}

&nbsp; header={<Header />}

>

&nbsp; {children}

</DashboardLayout>

```



\## Hooks personnalisés



\### useAuth

```javascript

const { user, profile, loading, refreshProfile, signOut } = useAuth()

```



\### useSupabase

```javascript

const { data, error, loading } = useSupabase(

&nbsp; () => getLootBoxes(),

&nbsp; \[] // dependencies

)

```



\### useToast

```javascript

const toast = useToast()



toast.success('Achat réussi!')

toast.error('Erreur de paiement')

toast.loading('Chargement...')

```



\### useModal

```javascript

const { isOpen, open, close } = useModal()

```



\## Animations Framer Motion



\### Fade In

```jsx

<motion.div

&nbsp; initial={{ opacity: 0 }}

&nbsp; animate={{ opacity: 1 }}

&nbsp; transition={{ duration: 0.6 }}

>

```



\### Slide Up

```jsx

<motion.div

&nbsp; initial={{ opacity: 0, y: 20 }}

&nbsp; animate={{ opacity: 1, y: 0 }}

&nbsp; transition={{ duration: 0.6 }}

>

```



\### Scale

```jsx

<motion.div

&nbsp; whileHover={{ scale: 1.05 }}

&nbsp; whileTap={{ scale: 0.95 }}

>

```



\### Stagger Children

```jsx

<motion.div

&nbsp; initial="hidden"

&nbsp; animate="visible"

&nbsp; variants={{

&nbsp;   visible: {

&nbsp;     transition: {

&nbsp;       staggerChildren: 0.1

&nbsp;     }

&nbsp;   }

&nbsp; }}

>

&nbsp; {items.map((item) => (

&nbsp;   <motion.div

&nbsp;     key={item.id}

&nbsp;     variants={{

&nbsp;       hidden: { opacity: 0, y: 20 },

&nbsp;       visible: { opacity: 1, y: 0 }

&nbsp;     }}

&nbsp;   />

&nbsp; ))}

</motion.div>

```



\## Utilitaires CSS



\### Ombres

```css

.shadow-soft { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

.shadow-soft-lg { box-shadow: 0 10px 40px rgba(0,0,0,0.1); }

```



\### Gradients

```css

.bg-gradient-primary {

&nbsp; background: linear-gradient(135deg, #86efac 0%, #22c55e 100%);

}

```



\### Animations

```css

.animate-float { animation: float 4s ease-in-out infinite; }

.animate-pulse-soft { animation: pulse 2s ease-in-out infinite; }

```



\## Patterns de code



\### Gestion d'état loading

```jsx

const \[loading, setLoading] = useState(false)

const \[error, setError] = useState('')



const handleAction = async () => {

&nbsp; setLoading(true)

&nbsp; setError('')

&nbsp; 

&nbsp; try {

&nbsp;   await doSomething()

&nbsp; } catch (err) {

&nbsp;   setError(err.message)

&nbsp; } finally {

&nbsp;   setLoading(false)

&nbsp; }

}

```



\### Formulaires

```jsx

const \[formData, setFormData] = useState({

&nbsp; email: '',

&nbsp; password: ''

})



const handleChange = (e) => {

&nbsp; setFormData(prev => ({

&nbsp;   ...prev,

&nbsp;   \[e.target.name]: e.target.value

&nbsp; }))

}



const handleSubmit = async (e) => {

&nbsp; e.preventDefault()

&nbsp; // Validation

&nbsp; if (!formData.email) {

&nbsp;   setError('Email requis')

&nbsp;   return

&nbsp; }

&nbsp; // Submit

}

```



\### Pagination

```jsx

const ITEMS\_PER\_PAGE = 20

const \[page, setPage] = useState(1)



const paginatedItems = items.slice(

&nbsp; (page - 1) \* ITEMS\_PER\_PAGE,

&nbsp; page \* ITEMS\_PER\_PAGE

)



const totalPages = Math.ceil(items.length / ITEMS\_PER\_PAGE)

```

