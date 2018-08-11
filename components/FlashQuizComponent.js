import React, { Component } from 'react';
import firebase from 'react-native-firebase';
import { View, Text, TouchableOpacity } from 'react-native';
import { Card, Button } from 'react-native-elements';

function RenderFlashcard (props) {
    const reversed = props.reversed;
    const text = props.text;

    if (reversed != null  && text != null) {
        return (
            <Card containerStyle={{ flex: 1, justifyContent: 'center', alignSelf: 'stretch', marginBottom: '5%', alignItems: 'center' }}>
                <View style={{ width: '90%', height: '90%', justifyContent: 'center', alignItems: 'center' }} >
                    <Text style={{ fontSize: 25, textAlign: 'justify' }}>{text}</Text>
                </View>
            </Card>
        );
    } else {
        return (
            <View>
                <Text>Flashcard invalid</Text>
            </View>
        );
    }
}

class FlashQuiz extends Component {

    constructor(props) {
        super(props);
        this.ref = firebase.firestore().collection('vocab');
        this.cacheSize = 2; // how large the cache should be
        this.state = {
            reversed: false,
            isFlipped: false,
            term: '',
            definition: '',
            wordBank: ["word", "term", "test"],
            currentSet: [],
            firestoreIds: []
        }
    }

    componentDidMount () {
        this.nextFlashcard();
    }

    getRandomNumber (max) {
        return Math.floor(Math.random() * Math.floor(max));
        // return 0;
    }

    removeIdFromIdArray (id) {
        var tempArray = this.state.firestoreIds;
        tempArray.splice(id, 1);
        this.setState ({
            firestoreIds: tempArray
        });
    }

    async createFirstCard () {
        var firestoreIds = this.state.firestoreIds;
        var randId = this.getRandomNumber(firestoreIds.length);
        let firstCardPromise = this.ref.where("numId", "==", firestoreIds[randId]).get();
        firstCardPromise.then((querySnapshot) => {
            var card = {term: querySnapshot.docs[0].data().term, definition: querySnapshot.docs[0].data().definition};
            this.setState ({
                term: card.term,
                definition: card.definition
            })
        })
        this.removeIdFromIdArray(randId);
    }

    async initializeCache () {
        var firestoreIds = this.state.firestoreIds;
        for (var i = 1; i < this.cacheSize; i++) { 
            var randId = this.getRandomNumber(firestoreIds.length);
            let promise = this.ref.where("numId", "==", firestoreIds[randId]).get();
            promise.then((querySnapshot) => {
                var tempArray = this.state.currentSet;
                tempArray.push({term: querySnapshot.docs[0].data().term, definition: querySnapshot.docs[0].data().definition});
                this.setState ({
                    currentSet: tempArray
                })
            })
            this.removeIdFromIdArray(randId);
        }
    }

    async getNextCard () {
        var firestoreIds = this.state.firestoreIds;
        var randId = this.getRandomNumber(firestoreIds.length);
        let cardPromise = this.ref.where("numId", "==", firestoreIds[randId]).get();
        cardPromise.then((querySnapshot) => {
            var card = {term: querySnapshot.docs[0].data().term, definition: querySnapshot.docs[0].data().definition};
            var tempArray = this.state.currentSet;
            tempArray.push(card);
            this.setState ({
                currentSet: tempArray
            })
        })
        this.removeIdFromIdArray(randId);
    }

    changeCard () {
        var tempArray = this.state.currentSet;
        var card = tempArray.shift();
        this.setState ({
            term: card.term,
            definition: card.definition,
            currentSet: tempArray
        })
    }

    async nextFlashcard () {
        if (this.state.firestoreIds.length === 0) { // No more to get from firebase
            if (this.state.currentSet.length === 0) { // No cards in cache
                let idPromise = this.ref.orderBy("numId", "desc").limit(1).get();
                idPromise.then((querySnapshot) => {
                    var lastId = querySnapshot.docs[0].data().numId;
                    var idArray = Array.apply(null, {length: lastId + 1}).map(Function.call, Number);
                    this.setState({
                        firestoreIds: idArray
                    })
                })
                .finally(() => {
                    this.createFirstCard();
                    this.initializeCache();
                })
            } else { // Run through the remainder of the cache
                this.changeCard();
            }
        } else { // Cards remaining in firebase
            this.changeCard();
            this.getNextCard();
        }
    }

    static navigationOptions = {
        title: 'Flashcard Quiz'
    }

    render () {
        if (!this.state.isFlipped)
            cardText = this.state.term;
        else
            cardText = this.state.definition;
        return (
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                <View style={{ flex: 2, flexDirection: 'row' }}>
                    <View style={{ flex: 1, flexDirection: 'row' }}>
                        <View style={{ flex: 2 }} ></View>
                        <TouchableOpacity style={{ flex: 5 }}
                            onPress={ () => this.setState({isFlipped: !this.state.isFlipped}) }>
                            <RenderFlashcard
                                reversed={this.state.reversed}
                                text={cardText}
                            />
                        </TouchableOpacity>
                        <View style={{ flex: 2 }} ></View>
                    </View>
                </View>
                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-evenly' }} >
                    <View style={{ flexDirection: 'row' }}>
                        <Button
                            onPress={ () => this.nextFlashcard() }
                            title="I didn't know it"
                            color="white"
                            buttonStyle={{
                                backgroundColor: '#D21F2E',
                                width: 150,
                                height: 45,
                                borderColor: 'transparent',
                                borderWidth: 0,
                                borderRadius: 5
                            }}
                        />
                        <Button
                            onPress={ () => this.nextFlashcard() }
                            title="I knew it"
                            color="black"
                            buttonStyle={{
                                backgroundColor: '#61CB2B',
                                width: 150,
                                height: 45,
                                borderColor: 'transparent',
                                borderWidth: 0,
                                borderRadius: 5
                            }}
                        />
                    </View>
                    <View tyle={{ flexDirection: 'row' }}>
                        <Button
                            onPress={ () => this.nextFlashcard() }
                            title="Previous Flashcard"
                            color="black"
                            buttonStyle={{
                                backgroundColor: '#BCBCBC',
                                width: 330,
                                height: 45,
                                borderColor: 'transparent',
                                borderWidth: 0,
                                borderRadius: 5
                            }}
                        />
                    </View>
                </View>
            </View>
        );
    }
    
}

export default FlashQuiz;