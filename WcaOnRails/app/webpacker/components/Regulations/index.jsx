import React from 'react';

class showGuidelines extends React.Component {
    constructor(props) {
        super(props);
        if (window.location.hash.includes("+")) {
            this.state = {
                checkboxChecked: true
            };
            this.showGuidelinesSelected();
        } else {
            this.state = {
                checkboxChecked: false
            };
        }
    }

    showGuidelines() {
        if (this.checkbox.checked) {
            this.showGuidelinesSelected();
            this.state["checkboxChecked"] = true;
        } else {
            this.showGuidelinesNotSelected();
            this.state["checkboxChecked"] = false;
        }
    }

    showGuidelinesSelected() {
        const hiddenGuidelines = document.getElementsByClassName("hidden-guideline");
        for (let i = 0; i < hiddenGuidelines.length; i++) {
            hiddenGuidelines[i].removeAttribute("hidden");
        }
    }

    showGuidelinesNotSelected() {
        const hiddenGuidelines = document.getElementsByClassName("hidden-guideline");
        for (let i = 0; i < hiddenGuidelines.length; i++) {
            hiddenGuidelines[i].setAttribute("hidden", "true");  // Consider using "until-found".
        }
    }

  render() {
        return (
            <div
                style={{
                    position: 'absolute',
                    top: '60px',
                    right: '0px',
                }}
            >
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f2f2f2',
                        padding: '10px',
                        borderRadius: '5px',
                    }}
                >
                    <input
                        type="checkbox"
                        onChange={() => this.showGuidelines()}
                        style={{ marginRight: '10px' }}
                        ref={ref => this.checkbox = ref}
                    />
                    Show Guidelines
                </label>
            </div>
        );
    }
}

export default showGuidelines;
