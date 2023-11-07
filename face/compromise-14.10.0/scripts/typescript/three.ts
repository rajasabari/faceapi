// import nlp from '../../src/three.js'
import nlp from '../../types/three'

let doc = nlp('okay cool')

// ### Chunker
doc.compute('chunks')
doc.chunks()
doc.clauses()

// ### Normalize
doc.normalize()

// ### Redact
doc.redact()

// ### Misc
doc.hyphenated()
doc.hashTags()
doc.emails()
doc.emoji()
doc.emoticons()
doc.atMentions()
doc.urls()
doc.pronouns()
doc.conjunctions()
doc.prepositions()
doc.honorifics()
doc.abbreviations()
doc.phoneNumbers()

doc.acronyms()
doc.acronyms().strip()
doc.parentheses()
doc.parentheses().strip()
doc.possessives()
doc.possessives().strip()
doc.quotations()
doc.quotations().strip()
doc.adjectives()
doc.adjectives().json()
doc.adverbs()
doc.adverbs().json()

// ### Nouns
doc.nouns()
doc.nouns().parse()
doc.nouns().json()
doc.nouns().isPlural()
doc.nouns().adjectives()
doc.nouns().toPlural()
doc.nouns().toSingular()

// ### Numbers
doc.numbers()
doc.numbers().parse()
doc.numbers().get()
doc.numbers().json()
doc.numbers().isOrdinal()
doc.numbers().isCardinal()
doc.numbers().toNumber()
doc.numbers().toLocaleString()
doc.numbers().toText()
doc.numbers().toCardinal()
doc.numbers().toOrdinal()
doc.numbers().isEqual()
doc.numbers().greaterThan(2)
doc.numbers().lessThan(2)
doc.numbers().between(2, 3)
doc.numbers().set(2)
doc.numbers().add(2)
doc.numbers().subtract(2)
doc.numbers().increment()
doc.numbers().decrement()
doc.percentages()
doc.money()
doc.fractions()
doc.fractions().parse()
doc.fractions().get()
doc.fractions().json()
doc.fractions().toDecimal()
doc.fractions().toFraction()
doc.fractions().toOrdinal()
doc.fractions().toCardinal()
doc.fractions().toPercentage()

// ### Sentences
doc.sentences()
doc.sentences().json()
doc.sentences().toPastTense()
doc.sentences().toPresentTense()
doc.sentences().toFutureTense()
doc.sentences().toInfinitive()
doc.sentences().toNegative()
doc.sentences().toPositive()
doc.sentences().isQuestion()
doc.sentences().isExclamation()
doc.sentences().isStatement()
doc.questions()

// ### Verbs
doc.verbs()
doc.verbs().parse()
doc.verbs().json()
doc.verbs().subjects()
doc.verbs().adverbs()
doc.verbs().isSingular()
doc.verbs().isPlural()
doc.verbs().isImperative()

doc.verbs().toInfinitive()
doc.verbs().toPresentTense()
doc.verbs().toPastTense()
doc.verbs().toFutureTense()
doc.verbs().toGerund()
doc.verbs().conjugate()
doc.verbs().isNegative()
doc.verbs().isPositive()
doc.verbs().toPositive()
doc.verbs().toNegative()

// ### Topics
doc.people()
doc.people().parse()
doc.people().json()
doc.places()
doc.organizations()
doc.topics()
