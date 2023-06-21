import fetch from 'node-fetch';

class YandexWorker {
  private _iamToken?: string;
  private _OAuthToken: string;
  private _folderId: string;

  constructor(OAuthToken: string, folderId: string) {
    this._OAuthToken = OAuthToken;
    this._folderId = folderId;
  }

  private async _getIAMToken(): Promise<string> {
    const res = await fetch('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
      method: 'post',
      body: JSON.stringify({
        yandexPassportOauthToken: this._OAuthToken
      })
    });

    if (!res.ok) {
      throw new Error('Error while getting yandex IEM Token');
    }

    const { iamToken } = (await res.json()) as {
      iamToken: string;
    };

    return iamToken;
  }

  public async init(): Promise<void> {
    this._iamToken = await this._getIAMToken();
    this._tokenWorker();
  }

  private _tokenWorker() {
    const schedule = 60 * 1000;
    const instance = this;
    setInterval(async () => {
      try {
        instance._iamToken = await this._getIAMToken();
      } catch (error) {
        console.log(error);
      }
    }, schedule);

    console.log('Yandex worker started');
  }

  public async detectLanguage(text: string): Promise<string> {
    try {
      if (!this._iamToken) {
        throw new Error('No IAMToken');
      }

      const res = await fetch(
        'https://translate.api.cloud.yandex.net/translate/v2/detect',
        {
          method: 'post',
          headers: {
            Authorization: `Bearer ${this._iamToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            folderId: this._folderId
          })
        }
      );

      if (!res.ok) {
        throw new Error('Yandex detect language request error');
      }

      const { languageCode } = (await res.json()) as {
        languageCode: string;
      };

      return languageCode;
    } catch (error: any) {
      return 'Unknown';
    }
  }
}

export default YandexWorker;
