// v1.62.0 ui: dates dd/MM/yyyy
import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { ZRecordService } from './z-record.service';
import { ZFieldInputComponent } from './z-field-input.component';
import { ZFieldDesignerComponent } from './z-field-designer.component';
import { DesignField, DesignerAdapter, bySection, checkValue, showIfOk, showValue, visibleOn } from './field-types';
import { ZListService } from './z-list.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { empFieldAdapter } from './emp-field-adapter';
import { assetFieldAdapter } from './asset-field-adapter';   // v1.16.0
import { ZLocationService } from './z-location.service';   // v1.30.0 location level
import { ZFormArrangerService } from './z-form-arranger.service';   // v1.39.0 form layout designer

interface FeedItem { kind: 'note' | 'message' | 'email_in' | 'change' | 'created' | 'deleted'; at: string; who: string; body?: string; changes?: any[]; attachments?: any[]; id?: number; mine?: boolean; to?: string; subject?: string;
  replies?: FeedItem[]; reactions?: Record<string, any>; resolved?: boolean; resolvedBy?: string; parent?: number | null; }
const EMOJIS = ['👍', '✅', '❤️', '🎉', '👀', '🙏'];
const TAG_COLOURS = ['grey', 'red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];

const ACT_TYPES = [
  { value: 'todo', label: 'To-do', icon: 'task_alt' }, { value: 'call', label: 'Call', icon: 'call' },
  { value: 'meeting', label: 'Meeting', icon: 'groups' }, { value: 'email', label: 'E-mail', icon: 'mail' },
  { value: 'document', label: 'Upload document', icon: 'upload_file' }, { value: 'approval', label: 'Approval', icon: 'approval' },
  { value: 'follow_up', label: 'Follow-up', icon: 'update' }, { value: 'reminder', label: 'Reminder', icon: 'alarm' },
];

/**
 * The record panel shown inside every screen's form (and on detail pages):
 * extra fields from the form designer, then Log note · Schedule activity · Files, planned activities
 * and one timeline of notes and changes (who changed what, when).
 */
@Component({
  selector: 'z-record-panel',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, ZFieldInputComponent, ZFieldDesignerComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
  <section class="zr" [class.zr-page]="mode === 'page'" aria-label="Record details, notes and activity">
    <!-- extra fields -->
    <div class="zr-extra" *ngIf="fields.length || canDesign">
      <div class="zr-head">
        <h4>More details</h4>
        <span class="zr-grow"></span>
        <button type="button" class="zr-link" *ngIf="canDesign" (click)="designing = true"><mat-icon>tune</mat-icon>{{ owned ? 'Design ' + ownerTitle.toLowerCase() + ' fields' : 'Design this form' }}</button>
        <button type="button" class="zr-link" *ngIf="canDesign && endpoint" (click)="arrange()" title="Drag the fields of this form to arrange them"><mat-icon>drag_indicator</mat-icon>Arrange fields</button>
      </div>
      <p class="zr-muted" *ngIf="!fields.length && !owned">No extra fields yet. Use “Design this form” to add fields such as a cost centre, a contract file or a rating.</p>
      <p class="zr-muted" *ngIf="!fields.length && owned">{{ ownerTitle }} fields have one designer: the fields you add there appear in this form with the other {{ ownerTitle.toLowerCase() }} details (reopen the form after designing).</p>
      <ng-container *ngFor="let g of visibleGroups(); trackBy: trackGroup">
        <div class="zr-sec" *ngIf="g.section">{{ g.section }}</div>
        <div class="zr-grid">
          <z-field-input *ngFor="let f of g.fields; trackBy: trackField" [attr.data-field]="f.name" [field]="f" [value]="values[f.name]" [error]="errors[f.name] || ''" [disabled]="locked(f)" [wide]="f.field_type === 'textarea' || f.field_type === 'multiselect'"
                         [upload]="id ? uploader(f.name) : undefined" (valueChange)="change(f, $event)"></z-field-input>
        </div>
      </ng-container>
      <div class="zr-save" *ngIf="dirty && id">
        <span class="zr-muted">Saved with the form, or now:</span>
        <button type="button" class="zr-btn primary" [disabled]="saving" (click)="saveNow()">{{ saving ? 'Saving…' : 'Save extra fields' }}</button>
      </div>
      <div class="zr-err" *ngIf="formError" role="alert">{{ formError }}</div>
    </div>

    <!-- v1.30.0 location level: the location this record belongs to -->
    <div class="zr-loc" *ngIf="loc?.applies">
      <mat-icon>place</mat-icon>
      <span class="zr-loc-lab">{{ loc.label }}:</span>
      <ng-container *ngIf="!locEditing"><b>{{ loc.location || '–' }}</b>
        <button type="button" class="zr-link" *ngIf="loc.can_change" (click)="locEditing = true">{{ loc.location ? 'Change' : 'Set' }}</button></ng-container>
      <ng-container *ngIf="locEditing">
        <select class="zr-loc-sel" [value]="loc.location_id ?? ''" (change)="locSet($any($event.target).value)">
          <option value="">–</option>
          <option *ngFor="let o of loc.options" [value]="o.id">{{ o.name }}</option>
        </select>
        <button type="button" class="zr-link" (click)="locEditing = false">Cancel</button>
      </ng-container>
    </div>

    <!-- v1.38.0 workflow: approvals of this record, send for approval, rules that watch it -->
    <div class="zr-flow" *ngIf="id && flow && (flow.approvals.length || flow.flows.length || flow.rules.length || flow.runs.length)">
      <div class="zr-flow-head"><mat-icon>account_tree</mat-icon><span>Workflow</span>
        <span class="zr-muted" *ngIf="flow.rules.length"> · {{ flow.rules.length }} rule{{ flow.rules.length === 1 ? '' : 's' }} watch this record type</span>
        <span class="zr-grow"></span>
        <a class="zr-link" routerLink="/main-sidebar/automation/approvals" *ngIf="flow.approvals.length">My approvals</a>
      </div>
      <div class="zr-appr" *ngFor="let a of flow.approvals">
        <span class="zr-badge" [class]="'zr-badge ' + a.status">{{ a.status_label || a.status }}</span>
        <div class="zr-appr-body"><b>{{ a.flow_name || 'Approval' }}</b>
          <span class="zr-muted"> · sent by {{ a.submitted_by_name || '–' }} · {{ a.created_at | date:'dd/MM/yyyy' }}</span>
          <ul class="zr-steps">
            <li *ngFor="let st of a.steps" [class]="'zr-step ' + st.status">
              <mat-icon>{{ st.status === 'approved' ? 'check_circle' : st.status === 'rejected' ? 'cancel' : st.status === 'pending' ? 'hourglass_top' : 'radio_button_unchecked' }}</mat-icon>
              <span>{{ st.level_name || ('Level ' + st.level) }} · {{ st.approver_name || st.delegate_name || '–' }}<span class="zr-muted" *ngIf="st.comment"> – {{ st.comment }}</span></span>
              <span class="zr-grow"></span>
              <ng-container *ngIf="st.status === 'pending' && st.can_act">
                <button type="button" class="zr-btn sm primary" [disabled]="busy" (click)="decide(a, st, 'approved')">Approve</button>
                <button type="button" class="zr-btn sm" [disabled]="busy" (click)="decideFor = decideFor === st.id ? null : st.id; comment = ''">Reject…</button>
              </ng-container>
            </li>
          </ul>
          <div class="zr-row" *ngIf="decideFor && decideForIn(a)">
            <input class="zr-in" [value]="comment" (input)="comment = $any($event.target).value" placeholder="Why (required)" aria-label="Rejection reason">
            <button type="button" class="zr-btn sm danger" [disabled]="busy || !comment.trim()" (click)="decide(a, stepOf(a, decideFor), 'rejected')">Reject</button>
          </div>
        </div>
      </div>
      <div class="zr-row zr-send" *ngIf="flow.flows.length">
        <select class="zr-loc-sel" [value]="sendFlow ?? ''" (change)="sendFlow = +$any($event.target).value || null" aria-label="Approval flow">
          <option value="">Send for approval…</option>
          <option *ngFor="let f of flow.flows" [value]="f.id">{{ f.name }}</option>
        </select>
        <button type="button" class="zr-btn sm primary" [disabled]="!sendFlow || busy" (click)="submitFlow()">Send</button>
      </div>
      <div class="zr-runs" *ngIf="flow.runs.length">
        <span class="zr-muted">Automation: </span>
        <span class="zr-run" *ngFor="let r of flow.runs.slice(0, 4)" [class]="'zr-run ' + r.status" [title]="r.error || ''">{{ r.workflow }} · {{ r.status }} · {{ r.started_at | date:'dd MMM HH:mm' }}</span>
        <a class="zr-link" routerLink="/main-sidebar/automation/runs" *ngIf="flow.can_manage">Execution log</a>
      </div>
    </div>

    <!-- chatter -->
    <div class="zr-chatter">
      <!-- v1.45.0 star, tags and followers -->
      <div class="zr-social" *ngIf="id">
        <button type="button" class="zr-star" [class.on]="starred" (click)="star()" [attr.aria-pressed]="starred" [title]="starred ? 'Remove from starred' : 'Star this record (Starred list in the app launcher and the home page)'">
          <mat-icon>{{ starred ? 'star' : 'star_border' }}</mat-icon></button>
        <span class="zr-tags">
          <span *ngFor="let t of tags" [class]="'zr-tag c-' + t.color">{{ t.name }}<button type="button" (click)="untag(t)" [attr.aria-label]="'Remove tag ' + t.name"><mat-icon>close</mat-icon></button></span>
          <ng-container *ngIf="tagging">
            <input class="zr-tag-in" list="zr-tag-list" [value]="tagText" (input)="tagText = $any($event.target).value" (keydown.enter)="addTag()" (keydown.escape)="tagging = false" placeholder="Tag name" aria-label="Tag name">
            <datalist id="zr-tag-list"><option *ngFor="let t of allTags" [value]="t.name"></option></datalist>
            <button type="button" class="zr-link" (click)="addTag()">Add</button></ng-container>
          <button type="button" class="zr-link" *ngIf="!tagging" (click)="startTag()"><mat-icon>sell</mat-icon>{{ tags.length ? '' : 'Add tag' }}</button>
        </span>
        <span class="zr-grow"></span>
        <span class="zr-fol">
          <button type="button" class="zr-btn sm" [class.primary]="!following" (click)="toggleFollow()" [title]="following ? 'Stop getting the messages of this record' : 'Get the messages of this record'">
            <mat-icon>{{ following ? 'notifications_active' : 'notifications_none' }}</mat-icon>{{ following ? 'Following' : 'Follow' }}</button>
          <button type="button" class="zr-btn sm" (click)="folOpen = !folOpen; loadUsers()" [attr.aria-expanded]="folOpen" title="Followers"><mat-icon>group</mat-icon>{{ followers.length }}</button>
          <div class="zr-fol-pop" *ngIf="folOpen">
            <div class="zr-sec">Followers</div>
            <div class="zr-fol-row" *ngFor="let f of followers"><mat-icon>{{ f.outside ? 'alternate_email' : 'person' }}</mat-icon><span>{{ f.name }}<small class="zr-muted"> · {{ f.reason }}</small></span>
              <span class="zr-grow"></span><button type="button" class="zr-ic" (click)="removeFollower(f)" [attr.aria-label]="'Remove ' + f.name"><mat-icon>close</mat-icon></button></div>
            <p class="zr-muted" *ngIf="!followers.length">Nobody follows this record yet.</p>
            <div class="zr-sec">Add followers</div>
            <select class="zr-in" (change)="addFollowerUser($any($event.target).value); $any($event.target).value = ''" aria-label="Add a user">
              <option value="">Choose a user…</option><option *ngFor="let u of users" [value]="u.id">{{ u.name }}</option></select>
            <div class="zr-row"><input class="zr-in" [value]="folEmail" (input)="folEmail = $any($event.target).value" placeholder="or an e-mail address (outside people)" aria-label="E-mail address">
              <button type="button" class="zr-btn sm" [disabled]="!folEmail.includes('@')" (click)="addFollowerEmail()">Add</button></div>
          </div>
        </span>
      </div>
      <div class="zr-bar" role="toolbar" aria-label="Notes, activities and files">
        <button type="button" class="zr-tab" [class.on]="tab === 'message'" [disabled]="!id" (click)="openTab('message')"><mat-icon>send</mat-icon>Send message</button>
        <button type="button" class="zr-tab" [class.on]="tab === 'note'" [disabled]="!id" (click)="openTab('note')"><mat-icon>edit_note</mat-icon>Log note</button>
        <button type="button" class="zr-tab" [class.on]="tab === 'activity'" [disabled]="!id" (click)="openTab('activity')"><mat-icon>event_available</mat-icon>Schedule activity</button>
        <button type="button" class="zr-tab" [class.on]="tab === 'files'" [disabled]="!id" (click)="openTab('files')"><mat-icon>attach_file</mat-icon>Files<span class="zr-count" *ngIf="attachments.length">{{ attachments.length }}</span></button>
        <button type="button" class="zr-tab" [class.on]="tab === 'remind'" [disabled]="!id" (click)="openTab('remind')" title="Remind me about this record on a date"><mat-icon>alarm</mat-icon>Remind me</button>
        <span class="zr-grow"></span>
        <button type="button" class="zr-link" *ngIf="id" (click)="printRec()" title="One PDF with the fields, notes and history"><mat-icon>print</mat-icon>Print</button>
        <span class="zr-muted zr-sum" *ngIf="id && !open">{{ summary() }}</span>
        <button type="button" class="zr-link" *ngIf="id" (click)="open = !open" [attr.aria-expanded]="open">
          <mat-icon>{{ open ? 'expand_less' : 'history' }}</mat-icon>{{ open ? 'Hide' : 'History' }}<span class="zr-count" *ngIf="!open && feed.length">{{ feed.length }}</span></button>
      </div>
      <p class="zr-muted zr-new" *ngIf="!id">Notes, activities, files and the change history are available once this record is saved.</p>

      <!-- v1.45.0 send message (to the followers, by e-mail too) -->
      <div class="zr-box" *ngIf="tab === 'message' && id">
        <div class="zr-to"><span class="zr-muted">To:</span>
          <span class="zr-chip" *ngFor="let f of recipients()">{{ f.name }}</span>
          <span class="zr-muted" *ngIf="!recipients().length">no followers yet – add e-mail addresses or &#64;mention someone</span>
          <input class="zr-in zr-to-in" [value]="msgEmails" (input)="msgEmails = $any($event.target).value" placeholder="+ e-mail addresses, separated by commas" aria-label="More e-mail addresses"></div>
        <input class="zr-in" [value]="msgSubject" (input)="msgSubject = $any($event.target).value" placeholder="Subject (optional)" aria-label="Subject">
        <textarea class="zr-in" rows="3" [value]="note" (input)="typed($event)" placeholder="Write a message – the followers get it in their inbox and by e-mail. Type @ to mention someone." aria-label="Message"></textarea>
        <ng-container *ngTemplateOutlet="mentionList"></ng-container>
        <div class="zr-pending" *ngIf="noteFiles.length"><span *ngFor="let f of noteFiles; let i = index" class="zr-chip"><mat-icon>description</mat-icon>{{ f.name }}<button type="button" (click)="noteFiles.splice(i, 1)" aria-label="Remove"><mat-icon>close</mat-icon></button></span></div>
        <div class="zr-row">
          <label class="zr-btn"><input type="file" multiple (change)="pickNoteFiles($event)" hidden><mat-icon>attach_file</mat-icon>Attach</label>
          <ng-container *ngTemplateOutlet="mediaBtns"></ng-container>
          <span class="zr-grow"></span>
          <button type="button" class="zr-btn" (click)="tab = ''">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="busy || recording || (!note.trim() && !noteFiles.length)" (click)="logNote('message')"><mat-icon>send</mat-icon>Send</button>
        </div>
      </div>
      <!-- v1.46.0 voice note (20 s) and photo from the camera -->
      <ng-template #mediaBtns>
        <button type="button" class="zr-btn" (click)="recording ? stopVoice() : startVoice()" [class.rec]="recording" [title]="recording ? 'Stop' : 'Record a voice note (up to 20 seconds)'">
          <mat-icon>{{ recording ? 'stop_circle' : 'mic' }}</mat-icon>{{ recording ? (recLeft + ' s') : 'Voice' }}</button>
        <label class="zr-btn" title="Take or choose a photo"><input type="file" accept="image/*" capture="environment" (change)="pickNoteFiles($event)" hidden><mat-icon>photo_camera</mat-icon>Photo</label>
      </ng-template>
      <ng-template #mentionList>
        <div class="zr-mention" *ngIf="mentionQ !== null && mentionMatches().length" role="listbox" aria-label="Mention someone">
          <button type="button" *ngFor="let u of mentionMatches()" (mousedown)="$event.preventDefault(); pickMention(u)" role="option">&#64;{{ u.name }}</button>
        </div>
      </ng-template>

      <!-- log note -->
      <div class="zr-box" *ngIf="tab === 'note' && id">
        <textarea class="zr-in" rows="3" [value]="note" (input)="typed($event)" placeholder="Write a note for the team (only visible inside the app). Type @ to mention someone – they are told." aria-label="Note"></textarea>
        <ng-container *ngTemplateOutlet="mentionList"></ng-container>
        <div class="zr-pending" *ngIf="noteFiles.length"><span *ngFor="let f of noteFiles; let i = index" class="zr-chip"><mat-icon>description</mat-icon>{{ f.name }}<button type="button" (click)="noteFiles.splice(i, 1)" aria-label="Remove"><mat-icon>close</mat-icon></button></span></div>
        <div class="zr-row">
          <label class="zr-btn"><input type="file" multiple (change)="pickNoteFiles($event)" hidden><mat-icon>attach_file</mat-icon>Attach</label>
          <ng-container *ngTemplateOutlet="mediaBtns"></ng-container>
          <span class="zr-grow"></span>
          <button type="button" class="zr-btn" (click)="tab = ''">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="busy || recording || (!note.trim() && !noteFiles.length)" (click)="logNote()">Log note</button>
        </div>
      </div>

      <!-- v1.46.0 remind me -->
      <div class="zr-box" *ngIf="tab === 'remind' && id">
        <div class="zr-row"><span class="zr-muted">Remind me on</span>
          <input type="date" class="zr-in zr-date" [value]="rem.date" (change)="rem.date = $any($event.target).value" aria-label="Reminder date">
          <button type="button" class="zr-link" (click)="rem.date = isoIn(1)">Tomorrow</button><button type="button" class="zr-link" (click)="rem.date = isoIn(7)">Next week</button>
          <button type="button" class="zr-link" (click)="rem.date = isoIn(30)">In a month</button></div>
        <input class="zr-in" [value]="rem.text" (input)="rem.text = $any($event.target).value" placeholder="What about it? e.g. Check the renewal offer" aria-label="Reminder">
        <div class="zr-row"><span class="zr-muted">It comes to your inbox and the bell on that day.</span><span class="zr-grow"></span>
          <button type="button" class="zr-btn" (click)="tab = ''">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="busy || !rem.date" (click)="remind()">Set reminder</button></div>
      </div>

      <!-- schedule activity -->
      <div class="zr-box" *ngIf="tab === 'activity' && id">
        <div class="zr-types" role="radiogroup" aria-label="Activity type">
          <button type="button" *ngFor="let t of actTypes" class="zr-type" [class.on]="act.activity_type === t.value" (click)="act.activity_type = t.value" role="radio" [attr.aria-checked]="act.activity_type === t.value"><mat-icon>{{ t.icon }}</mat-icon>{{ t.label }}</button>
        </div>
        <div class="zr-grid">
          <div class="zf zf-wide"><label class="zf-label" for="zr-sum">Summary</label><input id="zr-sum" class="zf-in" [value]="act.summary" (input)="act.summary = $any($event.target).value" placeholder="e.g. Collect the signed contract"></div>
          <div class="zf"><label class="zf-label" for="zr-due">Due date</label><input id="zr-due" type="date" class="zf-in" [value]="act.due_date" (change)="act.due_date = $any($event.target).value"></div>
          <div class="zf"><label class="zf-label" for="zr-who">Assigned to</label>
            <select id="zr-who" class="zf-in" (change)="act.assigned_to = +$any($event.target).value">
              <option *ngFor="let u of users" [value]="u.id" [selected]="u.id === act.assigned_to">{{ u.name }}{{ u.id === me ? ' (me)' : '' }}</option>
            </select></div>
          <div class="zf zf-wide"><label class="zf-label" for="zr-anote">Note</label><textarea id="zr-anote" class="zf-in" rows="2" [value]="act.note" (input)="act.note = $any($event.target).value"></textarea></div>
        </div>
        <div class="zr-row"><span class="zr-quick">
            <button type="button" class="zr-link" (click)="due(0)">Today</button><button type="button" class="zr-link" (click)="due(1)">Tomorrow</button><button type="button" class="zr-link" (click)="due(7)">Next week</button></span>
          <span class="zr-grow"></span>
          <button type="button" class="zr-btn" (click)="tab = ''">Cancel</button>
          <button type="button" class="zr-btn primary" [disabled]="busy" (click)="schedule()">Schedule</button></div>
      </div>

      <!-- files -->
      <div class="zr-box" *ngIf="tab === 'files' && id">
        <label class="zr-drop" (dragover)="$event.preventDefault()" (drop)="drop($event)">
          <input type="file" multiple (change)="pickFiles($event)" hidden><mat-icon>cloud_upload</mat-icon>
          <span>{{ busy ? 'Uploading…' : 'Drop files here or click to choose (up to 25 MB each)' }}</span></label>
        <ul class="zr-files" *ngIf="attachments.length">
          <li *ngFor="let a of attachments">
            <mat-icon>{{ icon(a) }}</mat-icon>
            <button type="button" class="zr-fname" (click)="openFile(a)">{{ a.name }}</button>
            <span class="zr-muted">{{ size(a.size) }} · {{ a.uploaded_by }} · {{ a.at | date:'dd/MM/yyyy' }}{{ a.field ? ' · field' : '' }}</span>
            <span class="zr-grow"></span>
            <button type="button" class="zr-ic" (click)="openFile(a, true)" aria-label="Download"><mat-icon>download</mat-icon></button>
            <button type="button" class="zr-ic" *ngIf="a.uploaded_by_id === me || admin" (click)="removeFile(a)" aria-label="Delete file"><mat-icon>delete_outline</mat-icon></button>
          </li>
        </ul>
      </div>

      <!-- planned activities -->
      <div class="zr-acts" *ngIf="openActs.length">
        <div class="zr-sec">Planned activities</div>
        <div class="zr-act" *ngFor="let a of openActs" [class.late]="a.when === 'overdue'" [class.today]="a.when === 'today'">
          <span class="zr-when">{{ a.when === 'overdue' ? (-a.days) + ' day' + (a.days === -1 ? '' : 's') + ' late' : a.when === 'today' ? 'Today' : 'In ' + a.days + ' day' + (a.days === 1 ? '' : 's') }}</span>
          <div class="zr-act-body"><b>{{ a.type_label }}: {{ a.summary }}</b><span class="zr-muted"> for {{ a.assigned_to_name }} · due {{ a.due_date | date:'dd MMM' }} · by {{ a.created_by }}</span>
            <div class="zr-act-note" *ngIf="a.note">{{ a.note }}</div>
            <div class="zr-row" *ngIf="doneFor === a.id">
              <input class="zr-in" [value]="feedback" (input)="feedback = $any($event.target).value" placeholder="Feedback (optional)" aria-label="Feedback">
              <button type="button" class="zr-btn primary" (click)="markDone(a)">Done</button></div>
          </div>
          <div class="zr-act-do" *ngIf="a.assigned_to === me || a.created_by_id === me || admin">
            <button type="button" class="zr-link" (click)="doneFor = doneFor === a.id ? null : a.id; feedback = ''"><mat-icon>check</mat-icon>Mark done</button>
            <button type="button" class="zr-link" (click)="cancelAct(a)"><mat-icon>close</mat-icon>Cancel</button></div>
        </div>
      </div>

      <!-- timeline -->
      <ol class="zr-feed" *ngIf="open && id">
        <li *ngIf="!feed.length" class="zr-muted">No notes or changes yet.</li>
        <li *ngFor="let f of feed" [class]="'zr-item ' + f.kind" [class.resolved]="f.resolved">
          <span class="zr-dot"><mat-icon>{{ f.kind === 'note' ? 'chat_bubble_outline' : f.kind === 'message' ? 'mail_outline' : f.kind === 'email_in' ? 'reply' : f.kind === 'created' ? 'add_circle_outline' : f.kind === 'deleted' ? 'delete_outline' : 'edit' }}</mat-icon></span>
          <div class="zr-item-body">
            <ng-container *ngTemplateOutlet="noteBody; context: { $implicit: f }"></ng-container>
            <ul class="zr-changes" *ngIf="f.changes?.length">
              <li *ngFor="let c of (f.changes || []).slice(0, f.kind === 'created' ? 6 : 50)"><span class="zr-f">{{ c.label }}</span>
                <ng-container *ngIf="f.kind !== 'created'"><span class="zr-old">{{ c.old ?? '—' }}</span><mat-icon class="zr-arrow">arrow_forward</mat-icon></ng-container><span class="zr-newv">{{ c.new ?? '—' }}</span></li>
              <li *ngIf="f.kind === 'created' && (f.changes || []).length > 6" class="zr-muted">and {{ (f.changes || []).length - 6 }} more values</li>
            </ul>
            <!-- v1.46.0 the thread: replies, reply box, resolved -->
            <div class="zr-thread" *ngIf="f.id && (f.replies?.length || replyTo === f.id)">
              <div class="zr-reply" *ngFor="let r of f.replies"><ng-container *ngTemplateOutlet="noteBody; context: { $implicit: r }"></ng-container></div>
              <div class="zr-row" *ngIf="replyTo === f.id">
                <input class="zr-in" [value]="replyText" (input)="replyText = $any($event.target).value" (keydown.enter)="sendReply(f)" placeholder="Reply…" aria-label="Reply">
                <button type="button" class="zr-btn sm primary" [disabled]="busy || !replyText.trim()" (click)="sendReply(f)">Reply</button>
                <button type="button" class="zr-btn sm" (click)="replyTo = null">Cancel</button></div>
            </div>
          </div>
        </li>
      </ol>
      <div class="zr-err" *ngIf="error" role="alert">{{ error }}</div>
    </div>

    <ng-template #noteBody let-f>
      <div><b>{{ f.who || 'System' }}</b> <span class="zr-muted">· {{ f.at | date:'dd/MM/yyyy HH:mm' }}{{ f.kind === 'created' ? ' · created this record' : f.kind === 'deleted' ? ' · deleted' : f.kind === 'message' ? ' · message' : f.kind === 'email_in' ? ' · replied by e-mail' : '' }}</span>
        <span class="zr-res" *ngIf="f.resolved"><mat-icon>task_alt</mat-icon>Resolved{{ f.resolvedBy ? ' by ' + f.resolvedBy : '' }}</span>
        <button type="button" class="zr-ic" *ngIf="(f.kind === 'note' || f.kind === 'message') && (f.mine || admin)" (click)="removeNote(f)" aria-label="Delete"><mat-icon>delete_outline</mat-icon></button></div>
      <div class="zr-muted zr-to-line" *ngIf="f.to">To: {{ f.to }}</div>
      <div class="zr-subj" *ngIf="f.subject && f.kind === 'message'">{{ f.subject }}</div>
      <div class="zr-note" *ngIf="f.body">{{ f.body }}</div>
      <div class="zr-pending" *ngIf="f.attachments?.length">
        <ng-container *ngFor="let a of f.attachments">
          <audio *ngIf="isAudio(a) && media[a.id]" [src]="media[a.id]" controls class="zr-audio"></audio>
          <img *ngIf="isImage(a) && media[a.id]" [src]="media[a.id]" class="zr-thumb" [alt]="a.name" (click)="openFile(a)">
          <button type="button" class="zr-chip" *ngIf="!(media[a.id] && (isAudio(a) || isImage(a)))" (click)="isAudio(a) || isImage(a) ? preview(a) : openFile(a)">
            <mat-icon>{{ isAudio(a) ? 'play_circle' : isImage(a) ? 'image' : 'description' }}</mat-icon>{{ isAudio(a) ? 'Voice note' : a.name }}</button>
        </ng-container></div>
      <div class="zr-acts-line" *ngIf="f.id && (f.kind === 'note' || f.kind === 'message' || f.kind === 'email_in')">
        <button type="button" *ngFor="let e of reactionList(f)" class="zr-react" [class.mine]="f.reactions?.[e]?.ids?.includes(me)" (click)="react(f, e)" [title]="f.reactions?.[e]?.users?.join(', ') || ''">{{ e }}<span *ngIf="f.reactions?.[e]?.n">{{ f.reactions[e].n }}</span></button>
        <span class="zr-react-pick"><button type="button" class="zr-link" (click)="pickFor = pickFor === f.id ? null : f.id" aria-label="Add a reaction"><mat-icon>add_reaction</mat-icon></button>
          <span class="zr-emojis" *ngIf="pickFor === f.id"><button type="button" *ngFor="let e of emojis" (click)="react(f, e); pickFor = null">{{ e }}</button></span></span>
        <button type="button" class="zr-link" *ngIf="!f.parent" (click)="replyTo = f.id; replyText = ''">Reply</button>
        <button type="button" class="zr-link" *ngIf="!f.parent && (f.replies?.length || f.resolved)" (click)="resolve(f)">{{ f.resolved ? 'Reopen' : 'Resolve' }}</button>
      </div>
    </ng-template>

    <z-field-designer *ngIf="designing && !owned" [screen]="endpoint" [screenName]="screenName" (closed)="designClosed($event)"></z-field-designer>
    <z-field-designer *ngIf="designing && owned" [adapter]="ownerAdapter" (closed)="designClosed($event)"></z-field-designer>
  </section>`,
})
export class ZRecordPanelComponent implements OnInit, OnDestroy {
  @Input() endpoint: string | null = null;
  @Input() id: string | null = null;
  @Input() mode: 'form' | 'page' = 'form';
  @Input() screenName = '';
  /** The form element the panel sits in (to know when it is gone). */
  @Input() host?: HTMLElement;

  fields: DesignField[] = [];
  groups: { section: string; fields: DesignField[] }[] = [];
  values: Record<string, any> = {};
  errors: Record<string, string> = {};
  attachments: any[] = [];
  activities: any[] = [];
  feed: FeedItem[] = [];
  users: any[] = [];
  me = 0; admin = false; canDesign = false;
  tab = ''; open = false; busy = false; saving = false; dirty = false; designing = false;
  note = ''; noteFiles: File[] = []; feedback = ''; doneFor: number | null = null;
  error = ''; formError = '';
  actTypes = ACT_TYPES;
  // v1.45.0 star, tags, followers, messages and @mentions
  starred = false; following = false; followers: any[] = []; folOpen = false; folEmail = '';
  tags: any[] = []; allTags: any[] = []; tagging = false; tagText = '';
  // v1.46.0 threads, reactions, reminders, voice and photo notes
  emojis = EMOJIS; replyTo: number | null = null; replyText = ''; pickFor: number | null = null;
  rem = { date: '', text: '' };
  recording = false; recLeft = 20; private recorder: MediaRecorder | null = null; private recTimer: any = null;
  media: Record<number, string> = {};
  msgEmails = ''; msgSubject = ''; mentions: { id: number; name: string }[] = []; mentionQ: string | null = null; private label = '';
  act: any = { activity_type: 'todo', summary: '', due_date: '', assigned_to: 0, note: '' };
  private key = 0;

  /** v1.12.0: self-service employee (no back-office rights): read-only and hidden fields apply. */
  ess = false;

  constructor(private rec: ZRecordService, private cd: ChangeDetectorRef, private el: ElementRef<HTMLElement>, private http: HttpClient, private zl: ZListService,
              private zloc: ZLocationService, private arranger: ZFormArrangerService) {}

  // ---------------------------------------------------------------- v1.30.0 location level
  loc: any = null; locEditing = false;
  private async locLoad(model: string | null): Promise<void> {
    this.loc = null; this.locEditing = false;
    if (!model || !this.id || !this.zloc.enabled) { return; }
    try {
      this.loc = await firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/org-structure/api/record-location/`,
        { params: { schema: localStorage.getItem('selectedSchema') || '', model, id: this.id } }));
    } catch { this.loc = null; }
    this.cd.detectChanges();
  }
  async locSet(v: string): Promise<void> {
    if (!this.loc) { return; }
    try {
      const r = await firstValueFrom(this.http.put<any>(`${environment.apiBaseUrl}/org-structure/api/record-location/`,
        { model: this.loc.model, id: this.id, location: v || null }, { params: { schema: localStorage.getItem('selectedSchema') || '' } }));
      this.loc.location_id = r.location_id; this.loc.location = r.location || '';
    } catch (e: any) { alert(e?.error?.detail || 'Could not change the location.'); }
    this.locEditing = false; this.cd.detectChanges();
  }

  /** Values by field name and label (for "show only if"). */
  private valueMap(): Record<string, any> {
    const out: Record<string, any> = {};
    for (const f of this.fields) { out[f.name] = this.values[f.name]; out[f.label] = this.values[f.name]; }
    return out;
  }
  /** Is the field shown now (show on, self service, show only if)? */
  shown(f: DesignField, vals = this.valueMap()): boolean {
    const r = f.rules || {};
    return visibleOn(r, this.id ? 'edit' : 'create') && (!this.ess || visibleOn(r, 'ess')) && showIfOk(r, vals);
  }
  // v1.37.1: the same group objects while the shown fields do not change – a new array on every change detection
  // re-created the inputs, so a Yes / No tick (and a file pick) was lost right after the click
  private _vg: { key: string; groups: any[] } | null = null;
  visibleGroups() {
    const vals = this.valueMap();
    const shown = this.fields.filter(f => this.shown(f, vals));
    const key = shown.map(f => `${f.id ?? ''}:${f.name}`).join('|');
    if (!this._vg || this._vg.key !== key) { this._vg = { key, groups: bySection(shown) }; }
    return this._vg.groups;
  }
  trackField(_: number, f: DesignField): string { return `${f.id ?? ''}:${f.name}`; }
  trackGroup(_: number, g: any): string { return g.section || ''; }
  locked(f: DesignField): boolean { return this.ess && !!f.rules?.ess_read_only; }
  /** Problems of the shown, changeable fields (the interceptor asks before the screen saves). */
  problems(): string[] {
    const vals = this.valueMap();
    return this.fields.filter(f => this.shown(f, vals) && !this.locked(f)).map(f => checkValue(f, this.values[f.name])).filter(Boolean);
  }

  /** Employee screens keep their own custom fields (employee form designer), not the generic extra fields. */
  get isEmployee(): boolean { return /\/employee\/api\/(Employee|emplist)\//i.test(this.endpoint || ''); }
  /** v1.16.0: the form's own designer (employee forms, assets) sent by the server – one designer per form. */
  owner: { store: string; kind: string; title: string } | null = null;
  get owned(): boolean { return !!this.owner || this.isEmployee; }
  get ownerTitle(): string { return this.owner?.title || 'Employee'; }
  private _ownAdapter?: DesignerAdapter;
  get ownerAdapter(): DesignerAdapter {
    const o = this.owner || { store: 'employee', kind: 'employee', title: 'Employee' };
    return this._ownAdapter ??= o.store === 'asset' ? assetFieldAdapter(this.http, environment.apiBaseUrl) : empFieldAdapter(this.http, environment.apiBaseUrl, o.kind);
  }

  get openActs(): any[] { return this.activities.filter(a => a.state === 'open'); }

  ngOnInit(): void {
    this.open = this.mode === 'page';
    this.key = this.rec.register({
      endpoint: this.endpoint, id: this.id, fields: [], values: this.values,
      visible: () => this.el.nativeElement.isConnected && (!this.host || this.host.isConnected),
      onError: (m) => { this.formError = m; this.markErrors(); this.cd.detectChanges(); },
      check: () => this.problems(),
      onSaved: (ep, id) => { this.dirty = false; if (!this.id) { this.endpoint = ep; this.id = id; this.rec.update(this.key, { endpoint: ep, id }); this.el.nativeElement.setAttribute('data-record', `${ep}#${id}`); } this.load(); },
    });
    this.zl.permissions().subscribe(p => { this.ess = !p.admin && !p.codes.size; this.cd.detectChanges(); });
    this.load();
    // v1.39.0: a panel that is part of a page (employee page) applies the company's layout to the forms of that page itself
    if (this.mode === 'page' && this.endpoint) {
      setTimeout(() => { const box = this.host || (this.el.nativeElement.closest('main, .sub-content-area') as HTMLElement | null); if (box) { this.arranger.apply(box, this.endpoint!); } }, 800);
    }
  }

  ngOnDestroy(): void { this.rec.unregister(this.key); }

  /** v1.39.0: open the form layout designer on the form that holds this panel (or the page). */
  arrange(): void {
    const box = this.host || (this.el.nativeElement.closest('.modal-content, mat-dialog-container, .ex-modal, .hr-modal-box, main, .sub-content-area') as HTMLElement | null) || this.el.nativeElement.parentElement;
    if (box && this.endpoint) { this.arranger.design(box, this.endpoint); }
  }

  // ---------- v1.38.0 workflow strip
  flow: { model: string; approvals: any[]; flows: any[]; rules: any[]; runs: any[]; can_manage?: boolean } | null = null;
  flowModel: string | null = null;
  sendFlow: number | null = null;
  decideFor: number | null = null;
  comment = '';
  private flowParams(): any { return { schema: localStorage.getItem('selectedSchema') || '' }; }
  async flowLoad(model: string | null): Promise<void> {
    this.flowModel = model;
    if (!model || !this.id) { this.flow = null; return; }
    try {
      this.flow = await firstValueFrom(this.http.get<any>(`${environment.apiBaseUrl}/flow/api/record/`, { params: { ...this.flowParams(), model, id: this.id } }));
    } catch { this.flow = null; }
    this.cd.detectChanges();
  }
  decideForIn(a: any): boolean { return (a.steps || []).some((s: any) => s.id === this.decideFor); }
  stepOf(a: any, id: number | null): any { return (a.steps || []).find((s: any) => s.id === id); }
  async submitFlow(): Promise<void> {
    if (!this.sendFlow || !this.flowModel) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/flow/api/approvals/submit/`, { flow: this.sendFlow, model: this.flowModel, id: this.id }, { params: this.flowParams() }));
      this.sendFlow = null; this.error = '';
      await this.flowLoad(this.flowModel); this.load();
    } catch (e: any) { this.error = e?.error?.detail || 'The request could not be sent.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async decide(a: any, st: any, decision: 'approved' | 'rejected'): Promise<void> {
    if (!st) { return; }
    this.busy = true;
    try {
      await firstValueFrom(this.http.post(`${environment.apiBaseUrl}/flow/api/approvals/${a.id}/steps/${st.id}/decide/`, { decision, comment: this.comment }, { params: this.flowParams() }));
      this.decideFor = null; this.comment = ''; this.error = '';
      await this.flowLoad(this.flowModel); this.load();
    } catch (e: any) { this.error = e?.error?.detail || 'The decision could not be saved.'; }
    this.busy = false; this.cd.detectChanges();
  }

  async load(): Promise<void> {
    try {
      if (this.id && this.endpoint) {
        const r = await firstValueFrom(this.rec.record(this.endpoint, this.id));
        this.owner = r.owner || null;
        this.applyFields(r.fields || [], r.values || {});
        this.attachments = r.attachments || [];
        this.activities = r.activities || [];
        this.me = r.me; this.admin = r.admin;
        this.feed = this.buildFeed(r);
        this.starred = !!r.starred; this.following = !!r.following; this.followers = r.followers || []; this.tags = r.tags || []; this.label = r.label || '';
        this.locLoad(r.model || null).then(() => { if (this.loc) { this.loc.model = r.model; } });
        this.flowLoad(r.model || null);
        this.canDesign = await this.designAllowed();
      } else if (this.endpoint) {
        const r = await firstValueFrom(this.rec.fields(this.endpoint));
        this.owner = r.owner || null;
        this.applyFields((r.fields || []).filter((f: any) => f.active), {});
        this.canDesign = !!r.can_design;
        for (const f of this.fields) { if (f.default && this.values[f.name] === undefined) { this.values[f.name] = f.default; } }
      }
    } catch (e: any) {
      if (e?.status !== 400) { this.error = e?.error?.detail || ''; }
    }
    this.rec.update(this.key, { fields: this.fields, values: this.values });
    this.cd.detectChanges();
  }

  private async designAllowed(): Promise<boolean> {
    if (!this.endpoint) { return false; }
    try { const r = await firstValueFrom(this.rec.fields(this.endpoint)); return !!r.can_design; } catch { return false; }
  }

  private applyFields(fields: any[], values: Record<string, any>): void {
    if (this.owned) { fields = []; }   // v1.16.0: shown by the form itself from its own designer (never twice)
    this.fields = fields;
    this.groups = bySection(fields);
    this._vg = null;
    for (const k of Object.keys(this.values)) { delete this.values[k]; }
    Object.assign(this.values, values);
  }

  private buildFeed(r: any): FeedItem[] {
    const items: FeedItem[] = [];
    const mk = (n: any): FeedItem => ({ kind: n.kind === 'message' ? 'message' : n.kind === 'email_in' ? 'email_in' : 'note', at: n.at, who: n.author, body: n.body,
      attachments: n.attachments, id: n.id, mine: n.author_id === r.me, subject: n.subject, to: (n.recipients || []).map((x: any) => x.name || x.email).join(', '),
      reactions: n.reactions || {}, resolved: n.resolved, resolvedBy: n.resolved_by, parent: n.parent_id, replies: [] });
    const tops = new Map<number, FeedItem>();
    const notes = (r.notes || []) as any[];
    for (const n of notes) { if (!n.parent_id) { const it = mk(n); tops.set(n.id, it); items.push(it); } }
    for (const n of [...notes].reverse()) { if (n.parent_id) { const p = tops.get(n.parent_id); if (p) { p.replies!.push(mk(n)); } else { items.push(mk(n)); } } }   // replies oldest first
    this.loadMedia(notes);
    for (const h of r.history || []) {
      const changes = Object.values(h.changes || {}).map((c: any) => ({ label: c.label, old: showValue(c.old) || null, new: showValue(c.new) || null }));
      items.push({ kind: h.action === 'created' ? 'created' : h.action === 'deleted' ? 'deleted' : 'change', at: h.at, who: h.user, changes });
    }
    return items.sort((a, b) => (a.at < b.at ? 1 : -1));
  }

  summary(): string {
    const notes = this.feed.filter(f => f.kind === 'note' || f.kind === 'message' || f.kind === 'email_in').length;
    const last = this.feed.find(f => f.kind === 'change' || f.kind === 'created' || f.kind === 'deleted');
    const parts = [];
    if (notes) { parts.push(`${notes} note${notes > 1 ? 's' : ''}`); }
    if (last) { parts.push(`last change by ${last.who || 'System'}, ${this.ago(last.at)}`); }
    return parts.join(' · ');
  }

  private ago(at: string): string {
    const m = Math.round((Date.now() - new Date(at).getTime()) / 60000);
    if (m < 1) { return 'just now'; } if (m < 60) { return `${m} min ago`; }
    const h = Math.round(m / 60); if (h < 24) { return `${h} h ago`; }
    const d = Math.round(h / 24); return `${d} day${d > 1 ? 's' : ''} ago`;
  }

  // ---------- extra fields
  change(f: DesignField, v: any): void {
    this.values[f.name] = v; this.dirty = true; this.errors[f.name] = ''; this.formError = '';
    this.rec.update(this.key, { values: this.values });
  }
  private markErrors(): void { const vals = this.valueMap(); for (const f of this.fields) { this.errors[f.name] = this.shown(f, vals) && !this.locked(f) ? checkValue(f, this.values[f.name]) : ''; } }
  uploader(field: string) {
    return async (file: File) => {
      const r = await firstValueFrom(this.rec.upload(this.endpoint!, this.id!, [file], field));
      return { id: r[0].id, name: r[0].name };
    };
  }
  async saveNow(): Promise<void> {
    this.markErrors();
    if (Object.values(this.errors).some(Boolean)) { this.formError = 'Fix the fields marked above.'; return; }
    this.saving = true;
    try {
      const ready = await this.rec.resolveFiles(this.endpoint!, this.id!, this.values);
      await firstValueFrom(this.rec.saveValues(this.endpoint!, this.id!, ready));
      this.dirty = false; this.formError = ''; await this.load();
    } catch (e: any) { this.formError = e?.error?.detail || 'Not saved.'; }
    this.saving = false; this.cd.detectChanges();
  }
  designClosed(changed: boolean): void { this.designing = false; if (changed) { this.load(); } }

  // ---------- chatter
  openTab(t: string): void {
    this.tab = this.tab === t ? '' : t;
    this.mentions = []; this.mentionQ = null;
    if (t === 'remind' && this.tab) { this.rem = { date: this.isoIn(1), text: '' }; }
    if ((t === 'message' || t === 'note') && this.tab) { this.loadUsers(); }
    if (t === 'activity' && this.tab) {
      this.act = { activity_type: 'todo', summary: '', due_date: this.isoIn(0), assigned_to: this.me, note: '' };
      if (!this.users.length) { this.rec.users().subscribe(u => { this.users = u; if (!u.some(x => x.id === this.me)) { this.users.unshift({ id: this.me, name: 'Me' }); } this.cd.detectChanges(); }); }
    }
  }
  isoIn(days: number): string { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
  due(days: number): void { this.act.due_date = this.isoIn(days); }

  pickNoteFiles(ev: Event): void { this.noteFiles.push(...Array.from((ev.target as HTMLInputElement).files || [])); }
  loadUsers(): void {
    if (this.users.length) { return; }
    this.rec.users().subscribe(u => { this.users = u; if (!u.some(x => x.id === this.me)) { this.users.unshift({ id: this.me, name: 'Me' }); } this.cd.detectChanges(); });
  }
  /** v1.45.0 @mentions: "@" + letters before the caret opens the people list. */
  typed(ev: Event): void {
    const ta = ev.target as HTMLTextAreaElement;
    this.note = ta.value;
    const before = ta.value.slice(0, ta.selectionStart || ta.value.length);
    const m = /(^|\s)@([\p{L}\w.]{0,30})$/u.exec(before);
    this.mentionQ = m ? m[2].toLowerCase() : null;
    this.mentions = this.mentions.filter(x => this.note.includes('@' + x.name));
  }
  mentionMatches(): any[] {
    const q = this.mentionQ || '';
    return this.users.filter(u => u.id !== this.me && (u.name || '').toLowerCase().split(/\s+/).some((w: string) => w.startsWith(q)) || (q && (u.name || '').toLowerCase().includes(q))).slice(0, 8);
  }
  pickMention(u: any): void {
    this.note = this.note.replace(/@([\p{L}\w.]{0,30})$/u, '@' + u.name + ' ');
    if (!this.mentions.some(x => x.id === u.id)) { this.mentions.push({ id: u.id, name: u.name }); }
    this.mentionQ = null;
  }
  recipients(): any[] {
    const out = this.followers.filter(f => f.user_id !== this.me);
    for (const m of this.mentions) { if (!out.some(f => f.user_id === m.id)) { out.push({ name: m.name, user_id: m.id }); } }
    return out;
  }
  async logNote(kind: 'note' | 'message' = 'note'): Promise<void> {
    this.busy = true; this.error = '';
    try {
      let ids: number[] = [];
      if (this.noteFiles.length) { ids = (await firstValueFrom(this.rec.upload(this.endpoint!, this.id!, this.noteFiles))).map(a => a.id); }
      await firstValueFrom(this.rec.addNote(this.endpoint!, this.id!, this.note.trim(), ids,
        { kind, mention_ids: this.mentions.map(m => m.id), subject: kind === 'message' ? this.msgSubject : '', emails: kind === 'message' ? this.msgEmails : '' }));
      this.note = ''; this.noteFiles = []; this.tab = ''; this.open = true; this.mentions = []; this.msgEmails = ''; this.msgSubject = '';
      await this.load();
    } catch (e: any) { this.error = e?.error?.detail || 'The note was not saved.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async schedule(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      await firstValueFrom(this.rec.addActivity({ endpoint: this.endpoint, id: this.id, ...this.act, page: location.pathname }));
      this.tab = ''; await this.load(); this.rec.refreshTodo();
    } catch (e: any) { this.error = e?.error?.detail || 'The activity was not scheduled.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async markDone(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.patchActivity(a.id, { state: 'done', feedback: this.feedback })); this.doneFor = null; await this.load(); this.rec.refreshTodo(); }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
  }
  async cancelAct(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.patchActivity(a.id, { state: 'cancelled' })); await this.load(); this.rec.refreshTodo(); }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
  }

  pickFiles(ev: Event): void { this.uploadFiles(Array.from((ev.target as HTMLInputElement).files || [])); }
  drop(ev: DragEvent): void { ev.preventDefault(); this.uploadFiles(Array.from(ev.dataTransfer?.files || [])); }
  private async uploadFiles(files: File[]): Promise<void> {
    if (!files.length) { return; }
    const big = files.find(f => f.size > 25 * 1024 * 1024);
    if (big) { this.error = `“${big.name}” is larger than 25 MB.`; return; }
    this.busy = true; this.error = '';
    try { await firstValueFrom(this.rec.upload(this.endpoint!, this.id!, files)); await this.load(); }
    catch (e: any) { this.error = e?.error?.detail || 'The files were not uploaded.'; }
    this.busy = false; this.cd.detectChanges();
  }
  openFile(a: any, download = false): void { this.rec.open(a, download).catch(() => { this.error = 'The file could not be opened.'; this.cd.detectChanges(); }); }
  async removeFile(a: any): Promise<void> {
    try { await firstValueFrom(this.rec.deleteAttachment(a.id)); await this.load(); } catch (e: any) { this.error = e?.error?.detail || 'Not deleted.'; }
  }
  async removeNote(f: FeedItem): Promise<void> {
    try { await firstValueFrom(this.rec.deleteNote(f.id!)); await this.load(); } catch (e: any) { this.error = e?.error?.detail || 'Not deleted.'; }
  }
  // ---------- v1.46.0 threads, reactions, reminders, voice / photo, print
  reactionList(f: FeedItem): string[] { return Object.keys(f.reactions || {}).filter(k => f.reactions![k]?.n); }
  async react(f: FeedItem, e: string): Promise<void> {
    try { await firstValueFrom(this.rec.react(f.id!, this.endpoint!, this.id!, e)); await this.load(); } catch (x: any) { this.error = x?.error?.detail || 'Not saved.'; }
    this.cd.detectChanges();
  }
  async sendReply(f: FeedItem): Promise<void> {
    if (!this.replyText.trim()) { return; }
    this.busy = true;
    try { await firstValueFrom(this.rec.addNote(this.endpoint!, this.id!, this.replyText.trim(), [], { parent: f.id, kind: 'note' })); this.replyTo = null; this.replyText = ''; await this.load(); }
    catch (x: any) { this.error = x?.error?.detail || 'The reply was not saved.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async resolve(f: FeedItem): Promise<void> {
    try { await firstValueFrom(this.rec.resolve(f.id!, this.endpoint!, this.id!, !f.resolved)); await this.load(); } catch (x: any) { this.error = x?.error?.detail || 'Not saved.'; }
    this.cd.detectChanges();
  }
  async remind(): Promise<void> {
    this.busy = true; this.error = '';
    try {
      await firstValueFrom(this.rec.addActivity({ endpoint: this.endpoint, id: this.id, activity_type: 'reminder', summary: this.rem.text.trim() || 'Look at this record again',
        due_date: this.rem.date, assigned_to: this.me, note: '', page: location.pathname }));
      this.tab = ''; await this.load(); this.rec.refreshTodo();
    } catch (x: any) { this.error = x?.error?.detail || 'The reminder was not set.'; }
    this.busy = false; this.cd.detectChanges();
  }
  async startVoice(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = e => { if (e.data.size) { chunks.push(e.data); } };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const type = rec.mimeType || 'audio/webm';
        const ext = /ogg/.test(type) ? 'ogg' : /mp4|aac/.test(type) ? 'm4a' : 'webm';
        this.noteFiles.push(new File([new Blob(chunks, { type })], `voice-note-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${ext}`, { type }));
        this.recording = false; clearInterval(this.recTimer); this.cd.detectChanges();
      };
      this.recorder = rec; rec.start(); this.recording = true; this.recLeft = 20;
      this.recTimer = setInterval(() => { this.recLeft--; if (this.recLeft <= 0) { this.stopVoice(); } this.cd.detectChanges(); }, 1000);
    } catch { this.error = 'The microphone is not available (allow it in the browser or the app).'; }
    this.cd.detectChanges();
  }
  stopVoice(): void { if (this.recorder && this.recorder.state !== 'inactive') { this.recorder.stop(); } clearInterval(this.recTimer); }
  isAudio(a: any): boolean { return /^audio\//.test(a.mime || '') || /\.(webm|ogg|m4a|mp3|wav)$/i.test(a.name || ''); }
  isImage(a: any): boolean { return /^image\//.test(a.mime || ''); }
  /** Voice notes and photos of the notes play / show in place (fetched with the login token). */
  private loadMedia(notes: any[]): void {
    for (const n of notes) {
      for (const a of n.attachments || []) {
        if ((this.isAudio(a) || this.isImage(a)) && !this.media[a.id] && a.size < 8 * 1024 * 1024) { this.preview(a); }
      }
    }
  }
  async preview(a: any): Promise<void> {
    try {
      const res = await fetch(`${this.rec.api}/chatter/api/attachments/${a.id}/download/?schema=${localStorage.getItem('selectedSchema') || ''}&inline=1`,
        { headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') } });
      if (res.ok) { this.media[a.id] = URL.createObjectURL(await res.blob()); this.cd.detectChanges(); }
    } catch { /* stays a chip */ }
  }
  async printRec(): Promise<void> {
    try {
      const res = await fetch(`${this.rec.api}/chatter/api/print/?schema=${localStorage.getItem('selectedSchema') || ''}&endpoint=${encodeURIComponent(this.endpoint!)}&id=${encodeURIComponent(this.id!)}`,
        { headers: { Authorization: 'Bearer ' + (localStorage.getItem('auth_token') || '') } });
      if (!res.ok) { throw new Error(); }
      const u = URL.createObjectURL(await res.blob());
      window.open(u, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(u), 60000);
    } catch { this.error = 'The PDF could not be made.'; this.cd.detectChanges(); }
  }

  // ---------- v1.45.0 star, tags, followers
  async star(): Promise<void> {
    try { const r = await firstValueFrom(this.rec.toggleStar(this.endpoint!, this.id!, this.label)); this.starred = r.starred; this.rec.stars$.next(r); }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    this.cd.detectChanges();
  }
  startTag(): void {
    this.tagging = true; this.tagText = '';
    if (!this.allTags.length) { this.rec.tags().subscribe(t => { this.allTags = t; this.cd.detectChanges(); }); }
  }
  async addTag(): Promise<void> {
    const name = this.tagText.trim();
    if (!name) { this.tagging = false; return; }
    try { const r = await firstValueFrom(this.rec.recordTags(this.endpoint!, this.id!, [name])); this.tags = r.tags; this.tagText = ''; this.tagging = false; }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    this.cd.detectChanges();
  }
  async untag(t: any): Promise<void> {
    try { const r = await firstValueFrom(this.rec.recordTags(this.endpoint!, this.id!, [], [t.id])); this.tags = r.tags; } catch { /* kept */ }
    this.cd.detectChanges();
  }
  private async fol(body: any): Promise<void> {
    try { const r = await firstValueFrom(this.rec.followers({ endpoint: this.endpoint, id: this.id, ...body })); this.followers = r.followers; this.following = r.following; this.error = ''; }
    catch (e: any) { this.error = e?.error?.detail || 'Not saved.'; }
    this.cd.detectChanges();
  }
  toggleFollow(): void { this.fol({ action: this.following ? 'unfollow' : 'follow' }); }
  addFollowerUser(id: string): void { if (id) { this.fol({ action: 'add', user_ids: [+id] }); } }
  addFollowerEmail(): void { const e = this.folEmail.trim(); if (e) { this.fol({ action: 'add', emails: [e] }); this.folEmail = ''; } }
  removeFollower(f: any): void { this.fol({ action: 'remove', follower_id: f.id }); }
  colours = TAG_COLOURS;

  icon(a: any): string { return /image/.test(a.mime) ? 'image' : /pdf/.test(a.mime) ? 'picture_as_pdf' : /sheet|excel|csv/.test(a.mime) ? 'table_chart' : 'description'; }
  size(n: number): string { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
}
