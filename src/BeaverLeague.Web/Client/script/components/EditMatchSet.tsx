import * as React from "react";
import { Grid, Row, Col, Table, ListGroup, ListGroupItem, Panel, Button } from "react-bootstrap";
import { api } from "services";
import { IGolfer, IMatchSet, IMatch } from "models";

interface IInactiveDescription {
    id: number; 
    firstName: string; 
    lastName: string;
}

interface ISelectableGolfer extends IGolfer {
    isSelected?: boolean;
}

interface IEditMatchSetProps {
    matchSetId: number;
}

interface IEditMatchSetState {
    golfers?: ISelectableGolfer[];
    matchset?: IMatchSet;
    inactives?: IInactiveDescription[]
}

interface IGolferListProps {
    name: string;
    golfers: Array<ISelectableGolfer>;
    selectGolfer: (g:IGolfer) => void;
}

interface IInactiveListProps {
    inactives: IInactiveDescription[];
}

interface IMatchListProps {
    matches: IMatch[]
}

const isSelected = (golfer: ISelectableGolfer) => 
    golfer.isSelected ? "success" : ""

const GolferList = (props: IGolferListProps) =>
    <Panel header={<h3>{props.name}</h3>} bsStyle="primary">
        <Table condensed hover>
            <tbody>
                {
                    props.golfers.map(g => 
                        <tr key={g.id} onClick={() => props.selectGolfer(g)} className={isSelected(g)}>
                            <td>{g.firstName} {g.lastName}</td>
                        </tr>
                    )
                }
            </tbody>
        </Table>
    </Panel>

const InactiveList = (props: IInactiveListProps) =>
    <Panel header={<h3>Inactive This Week</h3>} bsStyle="primary">
        <Table condensed hover>
            <tbody>
                {
                    props.inactives.map(i => 
                        <tr key={i.id}><td>{i.firstName} {i.lastName}</td></tr>
                    )
                }
            </tbody>                    
        </Table>
    </Panel>

const MatchList = (props: IMatchListProps) =>
    <Panel header={<h3>Matchups</h3>} bsStyle="primary">
        <Table condensed hover>
            <tbody>
                {
                    props.matches.map(m => 
                        <tr key={m.id}>
                            <td>
                                <small><div>{m.golferA.firstName} {m.golferA.lastName} vs</div>
                                    <div>{m.golferB.firstName} {m.golferB.lastName}</div>
                                </small>
                            </td>
                        </tr>
                    )
                }
            </tbody>
        </Table>
    </Panel>

export class EditMatchSet extends React.Component<IEditMatchSetProps, IEditMatchSetState> {

    constructor(props: IEditMatchSetProps) {
        super(props);
        this.state = {
            golfers: [],
            matchset: {
                id: null,
                seasonId: null,
                matchSetNumber: null,
                inactives: [],
                matches: []
            },
            inactives: []
        }
    }

    async componentDidMount() {
        let golfers = await api.getActiveGolfers();
        let matchset = await api.getMatchSet(this.props.matchSetId);
        this.setState(this.calculateState(golfers, matchset));
    }

    calculateState(golfers: IGolfer[], matchset: IMatchSet) {
        let availableGolfers = [];
        let inactives = [];
        
        for(let golfer of golfers) {
            let playing = matchset.matches.filter(m => 
                (m.golferA && m.golferA.id == golfer.id) || 
                (m.golferB && m.golferB.id == golfer.id));
            let inactive = matchset.inactives.filter(i => i.golferId == golfer.id);
            if(playing.length === 0 && inactive.length === 0) {
                availableGolfers.push(golfer);
            }
        }

        for(let inactive of matchset.inactives) {        
            let find = golfers.filter(g => g.id == inactive.golferId);
            if(find.length > 0) {
                inactives.push({
                    id: find[0].id,
                    firstName : find[0].firstName,
                    lastName : find[0].lastName
                });
            }
        }

        return {
            golfers: availableGolfers,
            matchset: matchset,
            inactives: inactives
        };
    }

    pairSelectedGolfers() {
        const selected = this.state.golfers.filter(g => g.isSelected);
        if(selected.length == 2) {
            this.state.golfers.splice(this.state.golfers.indexOf(selected[0], 1));
            this.state.golfers.splice(this.state.golfers.indexOf(selected[1], 1));
            this.state.matchset.matches.push({
                id: 0,
                golferA: selected[0],
                golferB: selected[1]
            });
        }
    }

    selectGolfer(golfer: ISelectableGolfer) {
        golfer.isSelected = !golfer.isSelected;
        
        this.pairSelectedGolfers();
        
        this.setState({
            golfers: this.state.golfers,
            matchset: this.state.matchset            
        })
    }

    render() {
        return (
            <Grid fluid={true}>
                <Row>
                    <Col sm={12}>
                        <h3 className="text-center">
                            Week # {this.state.matchset.matchSetNumber}
                        </h3>
                    </Col>
                </Row>
                <Row>
                    <Col sm={4}>
                        <GolferList name="Golfers" golfers={this.state.golfers} 
                                    selectGolfer={(g) => this.selectGolfer(g)}/>
                    </Col>
                    <Col sm={4}>
                        <MatchList matches={this.state.matchset.matches} />
                    </Col>
                    <Col sm={4}>
                        <InactiveList inactives={this.state.inactives} />
                    </Col>
                </Row>
                <Row>
                    <Button bsStyle="primary">Run AutoMatcher!</Button>
                </Row>
            </Grid>
        );
    }
}